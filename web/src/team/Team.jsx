import React, { Component } from 'react';
import { connect } from 'react-redux';
import FontAwesome from 'react-fontawesome';
import { getTeamMembers, toggleRole, inviteAgent } from './TeamActions';
import './Team.css';

// class Roles extends Component {
//   render() {
//     const { id, roles } = this.props.member;
//     const toggleRole = this.props.toggleRole;
//     return (
//       <div>
//         <label>
//           <input type='checkbox' checked={roles.indexOf('agent') >= 0} onChange={toggleRole(id, 'agent')} />
//           Agent
//         </label>
//         <label>
//           <input type='checkbox' checked={roles.indexOf('admin') >= 0} onChange={toggleRole(id, 'admin')} />
//           Admin
//         </label>
//       </div>
//     );
//   }
// }

// class AddAgentRow extends Component {
//   constructor(props) {
//     super(props);
//     this.state = { firstName: '', lastName: '', email: '' };
//   }
//   render() {
//     const { invite } = this.props;
//     return (
//       <tr>
//         <td>
//           <input type='text' placeholder='First name' value={this.state.firstName} onChange={e => this.setState({ firstName: e.target.value })} />
//           <input type='text' placeholder='Last name' value={this.state.lastName} onChange={e => this.setState({ lastName: e.target.value })} />
//         </td>
//         <td>
//           <input type='email' placeholder='Email address' value={this.state.email} onChange={e => this.setState({ email: e.target.value })} />
//         </td>
//         <td><button className='primary' onClick={_ => {
//           invite(this.state.firstName, this.state.lastName, this.state.email);
//           this.setState({ firstName: '', lastName: '', email: '' });
//         }}>Invite agent</button></td>
//       </tr>
//     );
//   }
// }

class Team extends Component {
  componentDidMount() {
    this.props.loadTeamMembers();
  }
  render() {
    // const { members, toggleRole, inviteAgent } = this.props;
    // var tbody;
    // if (typeof members === 'undefined') {
    //   tbody = (
    //     <tr>
    //       <td colSpan={3}><FontAwesome name='spinner' spin /> Loading...</td>
    //     </tr>
    //   );
    // }
    // else if (members instanceof Error) {
    //   tbody = (
    //     <tr>
    //       <td colSpan={3}>Error loading members: {members.message}</td>
    //     </tr>
    //   )
    // }
    // else {
    //   tbody = members.map(member => {
    //     const pending = member.pending ? <em>(Pending)</em> : null;
    //     const error = member.error ? <em>(Error inviting member: {member.error.message})</em> : null;
    //     return (
    //       <tr key={member.id}>
    //         <td>{member.first_name} {member.last_name} {error || pending}</td>
    //         <td>{member.email}</td>
    //         <td><Roles member={member} toggleRole={toggleRole} /></td>
    //       </tr>
    //     );
    //   });
    // }
    // return (
    //   <div>
    //     <Navigation />
    //     <Grid fluid className='full-height-panel'>
    //       <Row className='full-height-panel'>
    //         <Col xs={12}>
    //           <Table hover>
    //             <thead>
    //               <tr>
    //                 <th>Name</th>
    //                 <th>Email</th>
    //                 <th>Roles</th>
    //               </tr>
    //             </thead>
    //             <tbody>
    //               {tbody}
    //               <AddAgentRow invite={inviteAgent} />
    //             </tbody>
    //           </Table>
    //         </Col>
    //       </Row>
    //     </Grid>
    //   </div>
    // )
    return (
      <div className='TeamContainer'>
        <a href='/'><FontAwesome name='long-arrow-left' /> Back to conversations</a>
        <div className='Team'>
          <p><FontAwesome name='rocket' /> Coming soon &hellip;</p>
        </div>
      </div>
    )
  }
}

export default connect(state => state.team, dispatch => {
  return {
    loadTeamMembers: () => dispatch(getTeamMembers()),
    toggleRole: (userID, roleName) => {
      return (e) => {
        dispatch(toggleRole(userID, roleName, e.target.checked));
      };
    },
    inviteAgent: (firstName, lastName, email) => {
      dispatch(inviteAgent(firstName, lastName, email))
    }
  }
})(Team);