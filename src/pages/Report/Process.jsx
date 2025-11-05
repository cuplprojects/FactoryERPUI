import React, { useEffect, useState } from 'react'
import { Table, Spinner } from 'react-bootstrap'
import API from "../../CustomHooks/MasterApiHooks/api";

const ProcessDetails = ({ catchData, projectName, groupName }) => {
  const [processData, setProcessData] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProcesses = async () => {
      try {
        const response = await API.get('/Processes');
        setProcesses(response.data);
      } catch (error) {
        console.error("Error fetching processes:", error);
      }
    };

    fetchProcesses();
  }, []);

  useEffect(() => {
    const fetchProcessData = async () => {
      setLoading(true);
      try {
        const response = await API.get(`/Reports/process-wise/${projectName}/${catchData.catchNo}`);
        console.log(response.data)
        setProcessData(response.data);
      } catch (error) {
        console.error("Error fetching process data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (catchData?.catchNo) {
      fetchProcessData();
    }
  }, [catchData?.catchNo]);

  const getProcessName = (processId) => {
    const process = processes.find(p => p.id === processId);
    return process ? process.name : `Process ${processId}`;
  };

  if (!catchData) return null;

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center p-5">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div>
      
      <Table 
        striped 
        bordered 
        hover
        responsive
        className="shadow-sm rounded overflow-hidden bg-white w-100"
      >
        <thead>
          <tr>
            <th className="bg-primary text-white text-center rounded-top-start" style={{width: '15%'}}>Process</th>
            <th className="bg-primary text-white text-center" style={{width: '20%'}}>Zone</th>
            <th className="bg-primary text-white text-center" style={{width: '25%'}}>Team & Supervisor</th>
            <th className="bg-primary text-white text-center" style={{width: '15%'}}>Machine</th>
            <th className="bg-primary text-white text-center rounded-top-end" style={{width: '25%'}}>Time</th>
          </tr>
        </thead>
        <tbody>
          {processData.map((process) => (
            process.transactions.map((transaction, idx) => (
              <tr key={`${process.processId}-${idx}`}>
                <td className="text-center fw-medium text-nowrap">
                  {getProcessName(process.processId)}
                </td>
                <td className="text-center text-secondary">
                  {transaction.zoneName || ''}
                </td>
                <td className="text-center">
                  <div className="d-flex flex-wrap gap-1 justify-content-center align-items-center">
                    <span className="badge bg-warning text-dark text-truncate">
                      👤 {transaction.supervisor}
                    </span>
                    
                    {transaction.teamMembers?.map((member, index) => (
                      <span key={`member-${index}`} className="badge bg-light text-dark text-truncate">
                        {member.fullName}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="text-center text-secondary text-nowrap">
                  {transaction.machineName || ''}
                </td>
                <td className="text-center text-nowrap">
                  <div className="small">
                    <div>
                      <strong>Start:</strong> {new Date(transaction.startTime).toLocaleString()}
                    </div>
                    <div>
                      <strong>End:</strong> {new Date(transaction.endTime).toLocaleString()}
                    </div>
                  </div>
                </td>
              </tr>
            ))
          ))}
        </tbody>
      </Table>
    </div>
  )
}

export default ProcessDetails;
