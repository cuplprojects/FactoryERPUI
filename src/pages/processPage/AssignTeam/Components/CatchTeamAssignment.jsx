import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Button } from 'react-bootstrap';
import API from '../../../../CustomHooks/MasterApiHooks/api';
import { notification } from 'antd';
import Select from 'react-select'; // Import react-select

const CatchTeamAssignment = ({ teams, data, handleClose, processId, fetchTransactions }) => {
  const [selectedTeam, setSelectedTeam] = useState('');
  const [usersInTeam, setUsersInTeam] = useState([]);
  const [userOptions, setUserOptions] = useState([]); // List of users to be added to the team
  const [selectedUserToAdd, setSelectedUserToAdd] = useState(null); // User selected to be added
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (data?.[0]?.teamId) {
      setSelectedTeam(data[0].teamId);
      const team = teams.find((team) => team.teamId === data[0].teamId);
      if (team) {
        setUsersInTeam(team.users); // Populate team users when team is selected
      }
    }
    fetchUsers();
  }, [data, teams]);

  // Fetch all users for adding a new user to the team
  const fetchUsers = async () => {
    try {
      const response = await API.get('/User/operator');
      setUserOptions(response.data); // Assuming the response contains the list of users
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleTeamChange = (e) => {
    const teamId = parseInt(e.target.value);
    setSelectedTeam(teamId);
    const team = teams.find((team) => team.teamId === teamId);
    if (team) {
      setUsersInTeam(team.users); // Update users when team changes
    }
  };

  const handleRemoveUser = (userId) => {
    setUsersInTeam(usersInTeam.filter(user => user.userId !== userId));
  };

  const handleAddUser = () => {
    if (!selectedUserToAdd) {
      notification.warning({
        message: 'Warning',
        description: 'Please select a user to add.',
        placement: 'topRight',
        duration: 3
      });
      return;
    }

    const userToAdd = userOptions.find((user) => user.userId === selectedUserToAdd);

    if (userToAdd) {
      setUsersInTeam([...usersInTeam, userToAdd]); // Add the new user to the team
      setSelectedUserToAdd(null); // Reset the user selection
    }
  };

  const filteredUserOptions = userOptions.filter(user =>
    !usersInTeam.some(teamUser => teamUser.userId === user.userId)
  ).map(user => ({
    value: user.userId,
    label: user.fullName
  }));

  const handleConfirm = async () => {
    if (!selectedTeam) {
      notification.warning({
        message: 'Warning',
        description: 'Please select a team before confirming.',
        placement: 'topRight',
        duration: 3
      });
      return;
    }

    if (usersInTeam.length === 0) {
      notification.warning({
        message: 'Warning',
        description: 'Please add at least one user to the team before confirming.',
        placement: 'topRight',
        duration: 3
      });
      return;
    }

    try {
      setIsSaving(true);
      for (let item of data) {
        let existingTransactionData;

        if (item?.transactionId) {
          const response = await API.get(`/Transactions/${item.transactionId}`);
          existingTransactionData = response.data;
        }

        const allUserIds = [
          ...usersInTeam.map(user => user.userId),
        ];

        const postData = {
          transactionId: item?.transactionId || 0,
          interimQuantity: existingTransactionData ? existingTransactionData.interimQuantity : 0,
          remarks: existingTransactionData ? existingTransactionData.remarks : '',
          projectId: item?.projectId,
          quantitysheetId: item?.srNo || 0,
          processId: processId,
          zoneId: existingTransactionData ? existingTransactionData.zoneId : 0,
          machineId: existingTransactionData ? existingTransactionData.machineId : 0,
          status: existingTransactionData ? existingTransactionData.status : 0,
          alarmId: existingTransactionData ? existingTransactionData.alarmId : "",
          lotNo: item?.lotNo,
          teamId: allUserIds,
          voiceRecording: existingTransactionData ? existingTransactionData.voiceRecording : "",
        };

        await API.post('/Transactions', postData);
      }

      fetchTransactions();
      notification.success({
        message: 'Success',
        description: 'Team assigned successfully!',
        placement: 'topRight',
        duration: 3
      });
      handleClose();
      setIsSaving(false);
    } catch (error) {
      console.error('Error updating team:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to assign team. Please try again.',
        placement: 'topRight',
        duration: 3
      });
      setIsSaving(false);
    }
  };

  return (
    <div>
      <Row className="mb-3">
        <Col md={12}>
          <h5>Catch Numbers:</h5>
          {data?.length > 0 ? (
            <ul>
              {data.map((item, index) => (
                <li key={index}>Catch Number: {item?.catchNumber || 'N/A'}</li>
              ))}
            </ul>
          ) : (
            <p>No catch numbers available.</p>
          )}
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Select Team</Form.Label>
            <Form.Select value={selectedTeam} onChange={handleTeamChange}>
              <option value="">Select a team...</option>
              {teams.map((team) => (
                <option key={team.teamId} value={team.teamId}>
                  {team.teamName}
                  {team.users && team.users.length > 0 ? ` (${team.users.map(user => user.fullName).join(', ')})` : ""}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      {selectedTeam && (
        <>
          <Row className="mb-3">
            <Col md={12}>
              <h6>Users in selected team:</h6>
              <ul>
                {usersInTeam.map((user) => (
                  <li key={user.userId}>
                    {user.fullName}
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemoveUser(user.userId)}
                      className="ms-2"
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Select User to Add</Form.Label>
                <Select
                  value={selectedUserToAdd ? { value: selectedUserToAdd, label: userOptions.find(user => user.userId === selectedUserToAdd)?.fullName } : null}
                  onChange={(selectedOption) => setSelectedUserToAdd(selectedOption?.value || null)}
                  options={filteredUserOptions}
                  placeholder="Select a user..."
                  isClearable
                />
              </Form.Group>
              <Button variant="primary" onClick={handleAddUser}>
                Add User
              </Button>
            </Col>
          </Row>
        </>
      )}

      <Row>
        <Col md={12}>
          <Button
            variant="success"
            onClick={handleConfirm}
            disabled={!selectedTeam || usersInTeam.length === 0 || isSaving}
          >
            {isSaving ? (
              <span>
                <span className="spinner-border spinner-border-sm me-2" />
                {t('saving')}...
              </span>
            ) : (
              t('saveChanges')
            )}
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default CatchTeamAssignment;
