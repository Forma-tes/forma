

export const PROFILE_AVATARS = Array.from({length:10},(_,i)=>({id:`avatar-${String(i+1).padStart(2,'0')}`,gender:[0,2,5,6,8].includes(i)?'male':'female',src:`/avatars/avatar-${String(i+1).padStart(2,'0')}.webp`}));

export const defaultAvatarForGender = gender => gender==='female'?'avatar-02':gender==='male'?'avatar-01':'avatar-01';

export const avatarsForGender = gender => gender==='female'||gender==='male'?PROFILE_AVATARS.filter(avatar=>avatar.gender===gender):PROFILE_AVATARS;
