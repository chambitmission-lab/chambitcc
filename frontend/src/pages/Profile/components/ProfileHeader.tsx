interface ProfileHeaderProps {
  username: string
  fullName: string
}

const ProfileHeader = ({ username, fullName }: ProfileHeaderProps) => {
  return (
    <div className="profile-header">
      <div className="profile-avatar-large">
        {fullName.charAt(0).toUpperCase()}
      </div>
      <h2 className="profile-name">{fullName}</h2>
      <p className="profile-username">@{username}</p>
    </div>
  )
}

export default ProfileHeader
