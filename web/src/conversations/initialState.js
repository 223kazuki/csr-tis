/***********************************
********    Convention    ********
** `undefined` means not loaded **
**  `null` means error loading  **
** empty array means no results **
***********************************/

export default {
  ui: {
    createConversationWidgetState: 'default',
    actionBar: { active: false, selectedMessages: [], removeBotState: 'default', sendEmailState: 'default', sendSMSState: 'default', showAssignees: false },
    composerContent: '',
    jumpFilterValue: '',
    profileSelectedTab: 1
  },
  assignees: undefined,
  allConversations: {},
  conversations: {},
  selectedConversation: undefined, // 'layer:///conversations/9b9b911e-7698-4888-9a6c-de06f6f8bfaa'
  selectedProfile: undefined,
  selectedConversationStats: undefined,  // TODO: I don't like this
  zendeskTickets: {}
};
