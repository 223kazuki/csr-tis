import json, requests, pytz, time
from datetime import datetime
import dateutil
from meya import Component

def splitTimespan(timeslot, duration):
    if timeslot['end_time'] - timeslot['start_time'] < duration:
        return []
    else:
        splitStart = timeslot['start_time']
        splitEnd = splitStart + duration
        split = {'start_time': splitStart, 'end_time': splitEnd}
        nextSpan = {'start_time': splitEnd, 'end_time': timeslot['end_time']}

        return [split] + (splitTimespan(nextSpan, duration))
            
# User id in meya is conversation id'
class sendCal(Component):
    def start(self):
        nextHourTimestamp = int(round(time.time()))
        fiveDaysFromNowTimestamp = nextHourTimestamp + (5 * 24 * 3600)
        # Meetings will be set to 15 minutes
        durationInSeconds = 1800
        
        # Make API request for freeTimes
        req = 'https://layer-dom.herokuapp.com/freeTimes?start={0}&end={1}&duration={2}'.format(nextHourTimestamp, fiveDaysFromNowTimestamp, durationInSeconds)
        # Using Maddy's authorization header
        result = requests.get(req, headers={'authorization': 'agent-rgibxHxciE7cLoVZ6JdCvo39qwU-k_kdvj1fv4t3LiVGs_yfMO_zXJNkWsqevmn7spLsgjtpad4mrSYnSPPeQA'})
        cont = result.json()
        
        appID = 'd20ff4ac-ad1e-11e6-a549-f74119096b38'
        layerConvID = str(self.db.user.user_id)
        url = 'https://api.layer.com/apps/{0}/conversations/{1}/messages'.format(appID, layerConvID)
        tz = pytz.timezone('America/Los_Angeles')
        unix_times = result.json()['freeTimes']

        # Get split time slots
        newTimes = []
        for t in unix_times:
            newTimes.extend(splitTimespan(t, durationInSeconds))

        i, j = 0, 0
        # Convert times to isoformat and Replace 'start' instead of 'start_time'
        for times in newTimes:
            newTimes[i]['start'] = datetime.fromtimestamp(times['start_time'], tz).isoformat()
            del newTimes[i]['start_time']
            newTimes[i]['end'] = datetime.fromtimestamp(times['end_time'], tz).isoformat()
            del newTimes[i]['end_time']
            i += 1
        
        # Check work hours and only 3 options per date
        count = [0,0,0,0,0]
        for times in list(newTimes):
            parsedTime = dateutil.parser.parse(times['start'])
            if parsedTime.weekday() > 4 or parsedTime.hour < 9 or parsedTime.hour > 16:
                newTimes.remove(times)
            elif count[parsedTime.weekday()] > 2:
                newTimes.remove(times)
            else:
                count[parsedTime.weekday()] += 1
            

        #Calendar payload
        payload = {
            "sender_id": "layer:///identities/999999",
            "parts":
                [{ 
                    "body": json.dumps({
                            "title": 'Layer <> ' + self.db.user.get('company_name') + ' ' + 'Demo with Maddy',
                            "dates": newTimes
                    }),
                    "mime_type": "application/x.card.scheduling+json"
                }]
        }
        headers = {'Accept': 'application/vnd.layer+json; version=2.0', 'Authorization': 'Bearer ZufiQRKEBQgPDzFNZ7kwrcyENvSqFeoSZ47Wd1mOeBnSSW3S', 'Content-Type': 'application/json'}
        res = requests.post(url, json=payload, headers=headers)
        res = str(res)
        message = self.create_message(text=str(unix_times))
        
        
        return self.respond(message=None, action="next")