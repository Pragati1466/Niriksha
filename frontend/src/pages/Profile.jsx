import React, { useState } from 'react'
import { User, Mail, Phone, Building, MapPin, Calendar, Edit2, Save, Camera, Shield, Clock } from 'lucide-react'
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { useAuth } from '../contexts/AuthContext'

const Profile = () => {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || 'John',
    lastName: user?.lastName || 'Doe',
    email: user?.email || 'john.doe@government.gov',
    phone: user?.phone || '+1 234 567 8900',
    department: user?.department || 'Food Safety Inspection',
    employeeId: user?.employeeId || 'GOV-2024-001',
    location: user?.location || 'New York, NY',
    joinDate: user?.joinDate || '2020-03-15',
    specialization: user?.specialization || 'Food Safety & Hygiene',
    certifications: user?.certifications || ['Food Safety Inspector Level 2', 'HACCP Certified'],
    bio: user?.bio || 'Experienced government inspector with expertise in food safety regulations and compliance.'
  })

  const handleChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = () => {
    // In production, this would save to the backend
    setIsEditing(false)
    console.log('Profile saved:', profileData)
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Reset to original values
    setProfileData({
      firstName: user?.firstName || 'John',
      lastName: user?.lastName || 'Doe',
      email: user?.email || 'john.doe@government.gov',
      phone: user?.phone || '+1 234 567 8900',
      department: user?.department || 'Food Safety Inspection',
      employeeId: user?.employeeId || 'GOV-2024-001',
      location: user?.location || 'New York, NY',
      joinDate: user?.joinDate || '2020-03-15',
      specialization: user?.specialization || 'Food Safety & Hygiene',
      certifications: user?.certifications || ['Food Safety Inspector Level 2', 'HACCP Certified'],
      bio: user?.bio || 'Experienced government inspector with expertise in food safety regulations and compliance.'
    })
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Profile</h2>
          <p className="text-sm text-muted-foreground">
            Manage your personal information and preferences
          </p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Profile Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-12 h-12 text-primary" />
              </div>
              {isEditing && (
                <button className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-semibold">
                  {profileData.firstName} {profileData.lastName}
                </h3>
                <Badge variant="success">Active</Badge>
              </div>
              <p className="text-muted-foreground mb-4">{profileData.specialization}</p>
              
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-muted-foreground" />
                  <span>{profileData.department}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{profileData.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Joined {formatDate(profileData.joinDate)}</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold">156</div>
                <div className="text-xs text-muted-foreground">Inspections</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">98%</div>
                <div className="text-xs text-muted-foreground">Compliance</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">4.8</div>
                <div className="text-xs text-muted-foreground">Rating</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">First Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              ) : (
                <p className="text-sm">{profileData.firstName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Last Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              ) : (
                <p className="text-sm">{profileData.lastName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              ) : (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{profileData.email}</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              ) : (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{profileData.phone}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Professional Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Employee ID</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.employeeId}
                  onChange={(e) => handleChange('employeeId', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              ) : (
                <p className="text-sm">{profileData.employeeId}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Department</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.department}
                  onChange={(e) => handleChange('department', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              ) : (
                <p className="text-sm">{profileData.department}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Specialization</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.specialization}
                  onChange={(e) => handleChange('specialization', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              ) : (
                <p className="text-sm">{profileData.specialization}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              ) : (
                <p className="text-sm">{profileData.location}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Bio</label>
            {isEditing ? (
              <textarea
                value={profileData.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            ) : (
              <p className="text-sm">{profileData.bio}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Certifications</label>
            <div className="flex flex-wrap gap-2">
              {profileData.certifications.map((cert, index) => (
                <Badge key={index} variant="secondary">
                  <Shield className="w-3 h-3 mr-1" />
                  {cert}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Account Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <h4 className="font-medium text-sm">Password</h4>
              <p className="text-xs text-muted-foreground">Last changed 30 days ago</p>
            </div>
            <Button variant="outline" size="sm">
              Change Password
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <h4 className="font-medium text-sm">Two-Factor Authentication</h4>
              <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
            </div>
            <Button variant="outline" size="sm">
              Enable
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <h4 className="font-medium text-sm">Login History</h4>
              <p className="text-xs text-muted-foreground">View recent login activity</p>
            </div>
            <Button variant="outline" size="sm">
              <Clock className="w-4 h-4 mr-2" />
              View History
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Profile
