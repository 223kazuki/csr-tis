# Layer CSR Bot
These are the meya.ai Flows and Components for Layer CSR.

# To Use:
* Start chat with a greeting, such as `hi` or `Hello, there`
* For Sales: enter any phrase that contains `sales`, `try`, or `interested`. Case does NOT matter
* For Support: enter any phrase that contains `support` or `help`. Case does NOT matter
* If the bots says it cannot process your response, you will have to refresh and start over because the flow ended.

# To Modify;
* In `whichService.py`, change the regex expression `re.search(r'sales|try|interested', serv, re.IGNORECASE)` to include
any keywords you are looking for. Seperate keywords with '|', as in the example above.
