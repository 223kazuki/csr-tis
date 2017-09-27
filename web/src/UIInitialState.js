import { uuid4 } from './utils';

const user1 = {
  id: uuid4(),
  email: "bill@demo.com",
  first_name: "Bill",
  last_name: 'Hu'
};
const user2 = {
  id: uuid4(),
  email: "john@demo.com",
  first_name: "John",
  last_name: 'Montgomery'
}

export default {
  isDemo: false,
  clickThroughMessages: false,
  logo: '/navlogo.svg',
  companyName: 'Layer',
  demo: {
    primaryColor: '#2c3681',
    users: {
      [user1.id]: user1,
      [user2.id]: user2
    },
    conversations: {}
  }
};