import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, CheckCircle, XCircle, CalendarOff, Loader2, Mail, Phone, MapPin } from 'lucide-react';

const TeamsTab = () => {
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamLead, setTeamLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to get profile picture URL
  const getProfilePictureUrl = (profilePicture) => {
    if (!profilePicture) return null;
    if (profilePicture.startsWith('http')) return profilePicture;
    return `http://localhost:5000${profilePicture}`;
  };

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Current user from auth:', user);

        // First, fetch all employees to find the current user by email or other identifier
        const employeesResponse = await fetch('http://localhost:5000/api/employees');
        if (!employeesResponse.ok) {
          throw new Error('Failed to fetch employees');
        }
        const allEmployees = await employeesResponse.json();
        console.log('All employees:', allEmployees);

        // Find current user in employees list - try matching by email or other identifier
        const currentUserEmployee = allEmployees.find(emp => 
          emp.email === user?.email || 
          emp._id === user?.id ||
          emp.employeeId === user?.id
        );

        if (!currentUserEmployee) {
          console.log('Current user not found in employees list');
          setLoading(false);
          return;
        }

        const userEmployeeId = currentUserEmployee.employeeId;
        console.log('User employeeId found:', userEmployeeId);

        // Fetch all teams
        const teamsResponse = await fetch('http://localhost:5000/api/teams');
        if (!teamsResponse.ok) {
          throw new Error('Failed to fetch teams');
        }
        const allTeams = await teamsResponse.json();
        console.log('All teams:', allTeams);

        // Find the team that has the current user as a member using employeeId
        const userTeam = allTeams.find(team => {
          if (!team.members) return false;
          
          // Team members now store employeeIds, so we compare with user's employeeId
          return team.members.includes(userEmployeeId);
        });

        if (!userTeam) {
          console.log('User not found in any team');
          setLoading(false);
          return;
        }

        setTeam(userTeam);
        console.log('User team:', userTeam);

        // Filter team members from all employees using employeeId
        const members = allEmployees.filter(employee => {
          if (!userTeam.members) return false;
          
          // Compare employeeId with team member employeeIds
          return userTeam.members.includes(employee.employeeId);
        });

        console.log('Team members found:', members);
        setTeamMembers(members);

        // Find team lead details
        const lead = allEmployees.find(emp => emp.employeeId === userTeam.lead);
        setTeamLead(lead);

      } catch (err) {
        console.error('Error fetching team data:', err);
        setError('Failed to load team data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchTeamData();
    }
  }, [user]);

  // Simple status function
  const getMemberStatus = (member) => {
    // You can enhance this with actual attendance/status data
    const statuses = [
      { text: 'Available', icon: <CheckCircle className="w-3 h-3 mr-1 text-green-500" />, variant: 'outline' },
      { text: 'In Meeting', icon: <Users className="w-3 h-3 mr-1 text-blue-500" />, variant: 'secondary' },
      { text: 'Away', icon: <CalendarOff className="w-3 h-3 mr-1 text-yellow-500" />, variant: 'outline' },
      { text: 'Offline', icon: <XCircle className="w-3 h-3 mr-1 text-gray-500" />, variant: 'secondary' }
    ];
    
    // Simple random status for demo - replace with actual status logic
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    return randomStatus;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col justify-center items-center p-8">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-600" />
          <span className="text-lg">Loading your team...</span>
          <span className="text-sm text-muted-foreground mt-2">Fetching team information</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-500 text-center">
            <XCircle className="w-12 h-12 mx-auto mb-4" />
            <p className="font-semibold text-lg">Error loading team data</p>
            <p className="text-sm mt-2">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
              variant="outline"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!team) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Users className="w-6 h-6" />
            My Team
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">No Team Assigned</p>
          <p className="text-gray-500">
            You are not currently assigned to any team. Please contact your manager or HR department.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              {team.name}
            </CardTitle>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-500" />
                <span className="text-sm">
                  <strong>Location:</strong> {team.location || 'Not specified'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="text-sm">
                  <strong>Department:</strong> {team.department || 'Not specified'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">
                  <strong>Status:</strong> 
                  <Badge variant={team.status === 'active' ? 'default' : 'secondary'} className="ml-2">
                    {team.status || 'active'}
                  </Badge>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-purple-500" />
                <span className="text-sm">
                  <strong>Members:</strong> {teamMembers.length}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Team Lead Information */}
        {teamLead && (
          <div className="mt-4 p-4 bg-white rounded-lg border">
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              Team Lead
            </h3>
            <div className="flex items-center gap-4">
              <Avatar className="w-12 h-12">
                <AvatarImage 
                  src={getProfilePictureUrl(teamLead.profilePicture || teamLead.profilePhoto)} 
                  alt={teamLead.name} 
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <AvatarFallback className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                  {teamLead.name?.split(' ').map(n => n[0]).join('') || 'TL'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-semibold">{teamLead.name}</h4>
                <p className="text-sm text-gray-600">{teamLead.designation}</p>
                <p className="text-xs text-gray-500">{teamLead.department} • {teamLead.email}</p>
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Team Members ({teamMembers.length})
          </h3>
        </div>
        
        {teamMembers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">No Team Members</p>
            <p className="text-gray-500">
              There are no members in this team yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {teamMembers.map((member) => {
              const status = getMemberStatus(member);
              // Find current user by matching email or employeeId
              const isCurrentUser = member.email === user?.email || member.employeeId === user?.employeeId;
              
              return (
                <Card 
                  key={member._id || member.id} 
                  className={`p-4 flex flex-col items-center text-center transition-all duration-300 hover:shadow-lg ${
                    isCurrentUser ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50' : ''
                  }`}
                >
                  {isCurrentUser && (
                    <Badge className="mb-2 bg-blue-600">You</Badge>
                  )}
                  <Avatar className="w-20 h-20 mb-3 border-4 border-white shadow-md">
                    <AvatarImage 
                      src={getProfilePictureUrl(member.profilePicture || member.profilePhoto)} 
                      alt={member.name} 
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <AvatarFallback className="text-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                      {member.name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <h3 className="font-semibold text-lg mb-1">{member.name || 'Unknown User'}</h3>
                  <p className="text-sm text-muted-foreground mb-1">{member.designation || 'No designation'}</p>
                  <p className="text-xs text-blue-600 mb-2 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {member.email || ''}
                  </p>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant={status.variant} className="flex items-center">
                      {status.icon}
                      {status.text}
                    </Badge>
                  </div>
                  
                  <div className="w-full mt-auto pt-3 border-t border-gray-100">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>ID: {member.employeeId}</span>
                      <span>{member.department}</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
        
        {/* Team Statistics */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{teamMembers.length}</div>
            <div className="text-sm text-gray-600">Total Members</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {teamMembers.filter(m => getMemberStatus(m).text === 'Available').length}
            </div>
            <div className="text-sm text-gray-600">Available Now</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{team.department}</div>
            <div className="text-sm text-gray-600">Department</div>
          </Card>
        </div>
        
        
      </CardContent>
    </Card>
  );
};

export default TeamsTab;