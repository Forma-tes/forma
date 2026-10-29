import { ShieldCheck } from 'lucide-react';
import { PageHeading } from '../../components/ui/PageHeading.jsx';
import { AccessRequestsPage } from './AccessRequestsPage.jsx';
import { AdminAccessPage } from './AdminAccessPage.jsx';

export function AccessManagementPage({supabase,onToast,users,loading,profile,onUpdate,onDelete,onCreate,onRefresh,initialTab='requests'}){
  return <div className="page-content access-management-workspace">
    <PageHeading eyebrow="ADMINISTRATION" title={initialTab==='users'?'Access management · Users':'Access management · Requests'} subtitle={initialTab==='users'?'Manage user accounts, roles, and workspace feature permissions.':'Review access requests and grant workspace permissions.'} actions={<span className="status-tag status-good"><ShieldCheck size={14}/> Protected admin workspace</span>}/>
    {initialTab==='requests'?<AccessRequestsPage supabase={supabase} onToast={onToast}/>:<AdminAccessPage users={users} loading={loading} profile={profile} onUpdate={onUpdate} onDelete={onDelete} onCreate={onCreate} onRefresh={onRefresh}/>}
  </div>;
}
