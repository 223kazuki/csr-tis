import requests
from meya import Component

class autofillLeads(Component):
    def start(self):
        # Send request to CSR to autofill lead
        res = requests.get('https://layer-dom.herokuapp.com/autofillLeads?cid={0}'.format(str(self.db.user.user_id)), headers={'authorization': 'agent-rgibxHxciE7cLoVZ6JdCvo39qwU-k_kdvj1fv4t3LiVGs_yfMO_zXJNkWsqevmn7spLsgjtpad4mrSYnSPPeQA'})
        message = self.create_message(text="Thank you, " + self.db.user.get('name') + "! Let's set up a time for you to join us in a live demo!")
        
        return self.respond(message=message, action="next")