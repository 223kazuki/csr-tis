import re
from meya import Component

class ServiceFilter(Component):

    def start(self):
        serv = self.db.flow.get('service')
        # Search for an instance of 'sales' or 'try' or 'support' in input
        if re.search(r'sales|try|interested|demo|demonstration|see|learn|more', serv, re.IGNORECASE):
            action = "sales"
        # Seach for an instance of 'support' or 'help' in input
        elif re.search(r'support|help', serv, re.IGNORECASE):
            action = "customer_service"
        else:
            action = "not_matched"

        return self.respond(message=None, action=action)