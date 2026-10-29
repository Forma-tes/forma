import { PROFILE_AVATARS } from '../../lib/avatars.js';

export function ProfileAvatar({value,className=''}){const isRemotePhoto=typeof value==='string'&&/^https?:\/\//i.test(value);const avatar=PROFILE_AVATARS.find(a=>a.id===value)||PROFILE_AVATARS[0];return <img className={`profile-avatar-image ${className}`} src={isRemotePhoto?value:avatar.src} alt="Profile avatar" referrerPolicy="no-referrer" onError={e=>{if(isRemotePhoto){e.currentTarget.onerror=null;e.currentTarget.src=avatar.src;}}}/>;}
