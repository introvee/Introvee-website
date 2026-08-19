import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BarChart3,
  CircleDollarSign,
  Gauge,
  Headphones,
  LayoutDashboard,
  LogOut,
  Plus,
  Play,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  adminLogin,
  adminLogout,
  getAdminDashboard,
  getAdminDares,
  getAdminDonations,
  getAdminMe,
  getAdminPlayStoreStats,
  getAdminSupportRequest,
  getAdminSupportRequests,
  getAdminUser,
  getAdminUsers,
  saveAdminDare,
  updateAdminSupportStatus
} from '../services/api/admin';
import './styles.css';

const C = {
  accent: '#6FAE7B',
  muted: '#6D746D',
  danger: '#C9564B',
  card: '#FFFFFF'
};

const menu = [
  ['dashboard', 'Dashboard', LayoutDashboard, '/admin'],
  ['users', 'Users', Users, '/admin/users'],
  ['dares', 'Dares', Sparkles, '/admin/dares'],
  ['donations', 'Donations', CircleDollarSign, '/admin/donations'],
  ['support', 'Support Requests', Headphones, '/admin/support-requests'],
  ['playstore', 'Play Store', Play, '/admin/play-store'],
  ['settings', 'Settings', Settings, '/admin/settings']
] as const;

type Page = (typeof menu)[number][0];

type DareFormState = {
  level: number | string;
  task: number | string;
  day_number: number | string;
  life_category: string;
  title: string;
  description: string;
  easier_title: string;
  easier_description: string;
  safety_tip: string;
  difficulty: string;
  points: number | string;
  mascot_type: string;
  is_active: boolean;
};

type Route = {
  page: Page | 'login';
  detail: string | null;
};

function parseRoute(): Route {
  const parts = window.location.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
  if (parts[0] !== 'admin') return { page: 'dashboard', detail: null };
  if (parts[1] === 'login') return { page: 'login', detail: null };
  if (!parts[1]) return { page: 'dashboard', detail: null };
  if (parts[1] === 'users') return { page: 'users', detail: parts[2] ?? null };
  if (parts[1] === 'support-requests') return { page: 'support', detail: parts[2] ?? null };
  if (parts[1] === 'play-store') return { page: 'playstore', detail: null };
  if (parts[1] === 'dares') return { page: 'dares', detail: null };
  if (parts[1] === 'donations') return { page: 'donations', detail: null };
  if (parts[1] === 'settings') return { page: 'settings', detail: null };
  return { page: 'dashboard', detail: null };
}

function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function AdminApp() {
  const [admin, setAdmin] = useState<any>(null);
  const [booting, setBooting] = useState(true);
  const [route, setRoute] = useState<Route>(parseRoute());
  const compact = useCompact();

  useEffect(() => {
    const onPop = () => setRoute(parseRoute());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    getAdminMe()
      .then((nextAdmin) => {
        setAdmin(nextAdmin);
        if (parseRoute().page === 'login') navigate('/admin');
      })
      .catch(() => setAdmin(null))
      .finally(() => setBooting(false));
  }, []);

  if (booting) return <Centered><Spinner /></Centered>;
  if (!admin) return <AdminLogin onLogin={setAdmin} />;

  const page = route.page === 'login' ? 'dashboard' : route.page;

  return (
    <div className={`admin-shell ${compact ? 'admin-shell-compact' : ''}`}>
      <Sidebar admin={admin} active={page} compact={compact} onLogout={async () => { await adminLogout(); setAdmin(null); navigate('/admin/login'); }} />
      <main className="admin-main">
        <div className="admin-main-content">
          {page === 'dashboard' && <DashboardPage />}
          {page === 'users' && (route.detail ? <UserDetails id={route.detail} /> : <UsersPage />)}
          {page === 'dares' && <DaresPage />}
          {page === 'donations' && <DonationsPage />}
          {page === 'support' && (route.detail ? <SupportDetails id={route.detail} /> : <SupportPage />)}
          {page === 'playstore' && <PlayStorePage />}
          {page === 'settings' && <SettingsPage admin={admin} />}
        </div>
      </main>
    </div>
  );
}

function AdminLogin({ onLogin }: { onLogin: (admin: any) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      onLogin(await adminLogin(email.trim(), password));
      navigate('/admin');
    } catch (err: any) {
      await supabase.auth.signOut();
      setError(err?.message ?? 'Admin login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Centered>
      <form className="login-card" onSubmit={submit}>
        <div className="brand-mark"><ShieldCheck size={22} color={C.card} /></div>
        <h1 className="login-title">Introvee Admin</h1>
        <input className="input" placeholder="Email" autoCapitalize="none" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error ? <p className="error">{error}</p> : null}
        <button className="primary-button" type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
      </form>
    </Centered>
  );
}

function Sidebar({ admin, active, onLogout }: any) {
  return (
    <aside className="sidebar">
      <div className="logo-row"><div className="admin-logo">I</div><div className="logo-title">Introvee</div></div>
      <div className="menu-label">MENU</div>
      {menu.map(([key, label, Icon, path]) => (
        <button key={key} className={`nav-item ${active === key ? 'nav-item-active' : ''}`} onClick={() => navigate(path)}>
          <Icon size={19} color={active === key ? C.accent : C.muted} />
          <span>{label}</span>
        </button>
      ))}
      <div className="sidebar-spacer" />
      <div className="admin-email" title={admin.email}>{admin.email}</div>
      <button className="logout" onClick={onLogout}><LogOut size={18} color={C.danger} /><span>Logout</span></button>
    </aside>
  );
}

function DashboardPage() {
  const { data, loading, error, reload } = useLoad(getAdminDashboard);
  if (loading || error) return <StateView loading={loading} error={error} onRetry={reload} />;
  const s = data.summary;
  const cards = [
    ['Total Users', s.totalUsers, Users],
    ['Active Users', s.activeUsers, Gauge],
    ['New Users This Month', s.newUsersThisMonth, UserRound],
    ['Total Play Store Installs', value(s.totalPlayStoreInstalls), Play],
    ['Total Donations', s.totalDonations, CircleDollarSign],
    ['Donation Amount', money(s.donationAmount), CircleDollarSign],
    ['Support Requests', s.supportRequests, Headphones]
  ];
  const maxLevel = Math.max(1, ...data.usersByLevel.map((x: any) => x.users));
  return (
    <PageFrame title="Dashboard">
      <div className="card-grid">{cards.map(([label, amount, Icon]: any) => <MetricCard key={label} label={label} value={amount} Icon={Icon} />)}</div>
      <div className="two-col">
        <Panel title="Users by Level">
          {data.usersByLevel.length ? data.usersByLevel.map((row: any) => <ProgressRow key={row.level} label={`Level ${row.level}`} value={`${row.users} users`} pct={row.users / maxLevel} />) : <Empty text="No user levels yet." />}
        </Panel>
        <Panel title="Recent Donations">
          <DataTable columns={['User', 'Amount', 'Status', 'Date']} rows={data.recentDonations.map((d: any) => [d.userName, money(d.amount, d.currency), <Badge value={statusLabel(d.status)} />, date(d.createdAt)])} />
        </Panel>
      </div>
      <Panel title="Recent Users">
        <DataTable columns={['Name', 'Life Category', 'Current Level', 'Points', 'Joined Date']} rows={data.recentUsers.map((u: any) => [u.name || u.email, u.life_category, u.current_level, u.total_points, date(u.created_at)])} />
      </Panel>
    </PageFrame>
  );
}

function UsersPage() {
  const [query, setQuery] = useState<any>({ page: 1, pageSize: 20 });
  const { data, loading, error, reload } = useLoad(() => getAdminUsers(query), [query]);
  return (
    <PageFrame title="Users">
      <Filters query={query} setQuery={setQuery} fields={['search', 'lifeCategory', 'level', 'status']} />
      {loading || error ? <StateView loading={loading} error={error} onRetry={reload} /> : (
        <Panel title={`${data.total} users`}>
          <DataTable columns={['Profile', 'Name', 'Email', 'Life Category', 'Level', 'Points', 'Completed', 'Joined', 'Last Active', 'Status', 'Action']} rows={data.items.map((u: any) => [avatar(u), u.name, u.email, u.life_category, u.current_level, u.total_points, u.completed_dares, date(u.created_at), date(u.updated_at), <Badge value={u.status} />, <LinkButton label="View" onClick={() => navigate(`/admin/users/${u.id}`)} />])} />
          <Pagination page={query.page} pageCount={data.pageCount} onPage={(page: number) => setQuery({ ...query, page })} />
        </Panel>
      )}
    </PageFrame>
  );
}

function UserDetails({ id }: { id: string }) {
  const { data, loading, error, reload } = useLoad(() => getAdminUser(id), [id]);
  if (loading || error) return <PageFrame title="User Details"><StateView loading={loading} error={error} onRetry={reload} /></PageFrame>;
  const p = data.profile;
  return (
    <PageFrame title="User Details" action={<LinkButton label="Back" onClick={() => navigate('/admin/users')} />}>
      <div className="two-col">
        <Panel title="Profile Information"><Info rows={[['Name', p.name], ['Email', p.email], ['User ID', p.id], ['Life Category', p.life_category], ['Joined Date', date(p.created_at)], ['Last Active', date(p.updated_at)], ['Account Status', p.status]]} /></Panel>
        <Panel title="Progress"><Info rows={[['Current Level', data.progress.currentLevel], ['Current Points', data.progress.currentPoints], ['Completed Dares', data.progress.completedDares], ['Ignored Dares', data.progress.ignoredDares], ['Total Dares Attempted', data.progress.totalDaresAttempted]]} /></Panel>
      </div>
      <Panel title="Donation Summary"><Info rows={[['Total Donated', money(data.donationSummary.totalDonated)], ['Number of Donations', data.donationSummary.numberOfDonations], ['Last Donation', date(data.donationSummary.lastDonation)]]} /></Panel>
      <Panel title="Donation History"><DataTable columns={['Amount', 'Payment ID', 'Status', 'Payment Method', 'Date']} rows={data.donationHistory.map((d: any) => [money(d.amount, d.currency), d.paymentId || '-', <Badge value={statusLabel(d.status)} />, d.paymentMethod || '-', date(d.createdAt)])} /></Panel>
      <Panel title="Activity"><DataTable columns={['Activity', 'Points', 'Date']} rows={data.activity.map((a: any) => [activityLabel(a), a.points_earned, date(a.created_at)])} /></Panel>
    </PageFrame>
  );
}

function DaresPage() {
  const [query, setQuery] = useState<any>({ page: 1, pageSize: 20 });
  const [editing, setEditing] = useState<any>(null);
  const { data, loading, error, reload } = useLoad(() => getAdminDares(query), [query]);
  const clearFilters = () => setQuery({ page: 1, pageSize: query.pageSize ?? 20 });
  const toggle = async (d: any) => { await saveAdminDare(d.id, { is_active: !d.is_active }); reload(); };
  return (
    <PageFrame
      title="Dares"
      subtitle={!loading && !error ? `${data.total} Dares` : undefined}
      action={<button className="add-dare-button" onClick={() => setEditing({})}><Plus size={18} />Add Dare</button>}
    >
      <DareFilters query={query} setQuery={setQuery} levels={data?.levels ?? []} onClear={clearFilters} />
      {editing && <DareEditor dare={editing} levels={data?.levels ?? []} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
      {loading || error ? <StateView loading={loading} error={error} onRetry={reload} /> : (
        <section className="panel dares-table-card">
          <DaresTable items={data.items} onEdit={setEditing} onToggle={toggle} />
          <DarePagination data={data} query={query} setQuery={setQuery} />
        </section>
      )}
    </PageFrame>
  );
}

function DareFilters({ query, setQuery, levels, onClear }: any) {
  const hasFilters = Boolean(query.search || query.lifeCategory || query.level || query.status);
  const update = (patch: Record<string, unknown>) => setQuery({ ...query, ...patch, page: 1 });
  return (
    <section className="filter-card dares-filter-card">
      <label className="filter-field search-filter">
        <span>Search Dare</span>
        <div className="search-box search-box-wide">
          <Search size={17} color={C.muted} />
          <input placeholder="Search dare title or content..." value={query.search ?? ''} onChange={(e) => update({ search: e.target.value })} />
        </div>
      </label>
      <SelectField label="Life Category" value={query.lifeCategory ?? ''} onChange={(value: string) => update({ lifeCategory: value })}>
        <option value="">All Categories</option>
        {['Student', 'Employee / Worker', 'Homemaker', 'Retired'].map((category) => <option key={category} value={category}>{category}</option>)}
      </SelectField>
      <SelectField label="Level" value={query.level ?? ''} onChange={(value: string) => update({ level: value })}>
        <option value="">All Levels</option>
        {levels.map((level: number) => <option key={level} value={level}>Level {level}</option>)}
      </SelectField>
      <SelectField label="Status" value={query.status ?? ''} onChange={(value: string) => update({ status: value })}>
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="disabled">Disabled</option>
      </SelectField>
      <button className="clear-filter-button" onClick={onClear} disabled={!hasFilters}>Clear Filters</button>
    </section>
  );
}

function DaresTable({ items, onEdit, onToggle }: any) {
  if (!items.length) return <Empty text="No dares found." />;
  return (
    <div className="table-scroll">
      <table className="data-table dares-table">
        <thead>
          <tr>
            <th>Dare</th>
            <th>Level</th>
            <th>Life Category</th>
            <th>Points</th>
            <th>Completion Count</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((d: any) => (
            <tr key={d.id}>
              <td><span className="dare-title-cell" title={d.title}>{d.title}</span></td>
              <td><span className="td-text">Level {d.level}</span></td>
              <td><span className="td-text">{d.life_category}</span></td>
              <td><span className="td-text">{d.points}</span></td>
              <td><span className="td-text">{d.completion_count}</span></td>
              <td><Badge value={d.is_active === false ? 'disabled' : 'active'} /></td>
              <td>
                <div className="row-actions">
                  <button className="small-action-button" onClick={() => onEdit(d)}>Edit</button>
                  <button className={`small-action-button ${d.is_active === false ? '' : 'small-action-danger'}`} onClick={() => onToggle(d)}>{d.is_active === false ? 'Enable' : 'Disable'}</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DarePagination({ data, query, setQuery }: any) {
  const page = Number(query.page ?? 1);
  const pageSize = Number(query.pageSize ?? data.pageSize ?? 20);
  const pageCount = Math.max(1, Number(data.pageCount ?? 1));
  const start = data.total ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, data.total);
  const pages = useMemo(() => paginationItems(page, pageCount), [page, pageCount]);
  return (
    <div className="dares-pagination">
      <div className="pagination-summary">Showing {start}-{end} of {data.total} dares</div>
      <div className="pagination-controls">
        <button className="page-button page-button-text" disabled={page <= 1} onClick={() => setQuery({ ...query, page: page - 1 })}>Previous</button>
        {pages.map((item, index) => item === '...'
          ? <span key={`${item}-${index}`} className="page-ellipsis">...</span>
          : <button key={item} className={`page-button ${item === page ? 'page-button-active' : ''}`} onClick={() => setQuery({ ...query, page: item })}>{item}</button>
        )}
        <button className="page-button page-button-text" disabled={page >= pageCount} onClick={() => setQuery({ ...query, page: page + 1 })}>Next</button>
        <select className="page-size-select" value={pageSize} onChange={(e) => setQuery({ ...query, pageSize: Number(e.target.value), page: 1 })}>
          {[20, 50, 100].map((size) => <option key={size} value={size}>{size} / page</option>)}
        </select>
      </div>
    </div>
  );
}

function paginationItems(page: number, pageCount: number) {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1);
  const items: Array<number | string> = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);
  if (start > 2) items.push('...');
  for (let next = start; next <= end; next += 1) items.push(next);
  if (end < pageCount - 1) items.push('...');
  items.push(pageCount);
  return items;
}

function DareEditor({ dare, levels, onClose, onSaved }: any) {
  const [form, setForm] = useState<DareFormState>({
    level: dare.level ?? 1,
    task: dare.task ?? 1,
    day_number: dare.day_number ?? 1,
    life_category: dare.life_category ?? 'Student',
    title: dare.title ?? '',
    description: dare.description ?? '',
    easier_title: dare.easier_title ?? '',
    easier_description: dare.easier_description ?? '',
    safety_tip: dare.safety_tip ?? '',
    difficulty: dare.difficulty ?? 'easy',
    points: dare.points ?? 10,
    mascot_type: dare.mascot_type ?? '',
    is_active: dare.is_active !== false
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (key: string, formValue: any) => setForm({ ...form, [key]: formValue });
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await saveAdminDare(dare.id ?? null, { ...form, level: Number(form.level), task: Number(form.task), day_number: Number(form.day_number), points: Number(form.points), mascot_type: form.mascot_type || null });
      onSaved();
    } catch (err: any) {
      setError(err?.message ?? 'Could not save dare.');
      setSaving(false);
    }
  };
  return (
    <section className="panel dare-editor-card">
      <div className="editor-heading">
        <h2>{dare.id ? 'Edit Dare' : 'Add New Dare'}</h2>
        <Badge value={form.is_active ? 'active' : 'disabled'} />
      </div>
      <form onSubmit={save}>
        <FormSection title="Basic Information">
          <SelectField label="Life Category" value={form.life_category} onChange={(value: string) => set('life_category', value)}>
            {['Student', 'Employee / Worker', 'Homemaker', 'Retired'].map((category) => <option key={category} value={category}>{category}</option>)}
          </SelectField>
          <TextField label="Dare Title" value={form.title} onChange={(value: string) => set('title', value)} />
          <TextAreaField label="Dare Description / Task" value={form.description} onChange={(value: string) => set('description', value)} />
          <TextAreaField label="How to Do It / Instruction" value={form.easier_description} onChange={(value: string) => set('easier_description', value)} />
          <TextField label="Easier Dare Title" value={form.easier_title} onChange={(value: string) => set('easier_title', value)} />
          <TextAreaField label="Safety / Reminder Text" value={form.safety_tip} onChange={(value: string) => set('safety_tip', value)} />
        </FormSection>
        <FormSection title="Classification">
          <SelectField label="Difficulty" value={form.difficulty} onChange={(value: string) => set('difficulty', value)}>
            {['easy', 'medium', 'hard'].map((difficulty) => <option key={difficulty} value={difficulty}>{difficulty}</option>)}
          </SelectField>
          <TextField label="Mood / Type" value={form.mascot_type} onChange={(value: string) => set('mascot_type', value)} />
          <SelectField label="Status" value={form.is_active ? 'active' : 'disabled'} onChange={(value: string) => set('is_active', value === 'active')}>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </SelectField>
        </FormSection>
        <FormSection title="Progress Settings">
          <SelectField label="Level" value={String(form.level)} onChange={(value: string) => set('level', value)}>
            {[...new Set([...(levels ?? []), Number(form.level)].filter(Boolean))].sort((a: number, b: number) => a - b).map((level: number) => <option key={level} value={level}>Level {level}</option>)}
          </SelectField>
          <TextField label="Order / Dare Number" value={form.task} inputMode="numeric" onChange={(value: string) => set('task', value)} />
          <TextField label="Journey Day" value={form.day_number} inputMode="numeric" onChange={(value: string) => set('day_number', value)} />
          <TextField label="Points" value={form.points} inputMode="numeric" onChange={(value: string) => set('points', value)} />
        </FormSection>
        {error ? <p className="error">{error}</p> : null}
        <div className="form-actions">
          <button type="button" className="secondary-form-button" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary-form-button" disabled={saving}>{saving ? 'Saving...' : dare.id ? 'Update Dare' : 'Save Dare'}</button>
        </div>
      </form>
    </section>
  );
}

function FormSection({ title, children }: any) {
  return <fieldset className="form-section"><legend>{title}</legend><div className="form-grid">{children}</div></fieldset>;
}

function TextField({ label, value: fieldValue, onChange, inputMode }: any) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <input className="input" value={String(fieldValue ?? '')} inputMode={inputMode} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function TextAreaField({ label, value: fieldValue, onChange }: any) {
  return (
    <label className="form-field form-field-full">
      <span>{label}</span>
      <textarea className="textarea" value={String(fieldValue ?? '')} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function SelectField({ label, value: fieldValue, onChange, children }: any) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <select className="select" value={String(fieldValue ?? '')} onChange={(e) => onChange(e.target.value)}>{children}</select>
    </label>
  );
}

function DonationsPage() {
  const [query, setQuery] = useState<any>({ page: 1, pageSize: 20 });
  const { data, loading, error, reload } = useLoad(() => getAdminDonations(query), [query]);
  return (
    <PageFrame title="Donations">
      <Filters query={query} setQuery={setQuery} fields={['search', 'status', 'from', 'to']} />
      {loading || error ? <StateView loading={loading} error={error} onRetry={reload} /> : <>
        <div className="card-grid">
          <MetricCard label="Total Donation Amount" value={money(data.totals.total_amount)} Icon={CircleDollarSign} />
          <MetricCard label="Total Successful Donations" value={data.totals.successful} Icon={ShieldCheck} />
          <MetricCard label="Donations This Month" value={data.totals.this_month} Icon={BarChart3} />
          <MetricCard label="Failed Payments" value={data.totals.failed} Icon={Headphones} />
        </div>
        <Panel title={`${data.total} donations`}>
          <DataTable columns={['User Name', 'Email', 'Amount', 'Currency', 'Payment ID', 'Order ID', 'Payment Method', 'Payment Status', 'Date', 'Time']} rows={data.items.map((d: any) => [d.userName, d.email, money(d.amount, d.currency), d.currency, d.paymentId || '-', d.orderId, d.paymentMethod || '-', <Badge value={statusLabel(d.status)} />, date(d.createdAt), time(d.createdAt)])} />
          <Pagination page={query.page} pageCount={data.pageCount} onPage={(page: number) => setQuery({ ...query, page })} />
        </Panel>
      </>}
    </PageFrame>
  );
}

function SupportPage() {
  const [query, setQuery] = useState<any>({ page: 1, pageSize: 20 });
  const { data, loading, error, reload } = useLoad(() => getAdminSupportRequests(query), [query]);
  return (
    <PageFrame title="Support Requests">
      <Filters query={query} setQuery={setQuery} fields={['status']} />
      {loading || error ? <StateView loading={loading} error={error} onRetry={reload} /> : (
        <Panel title={`${data.total} requests`}>
          <DataTable columns={['User', 'Email', 'Level', 'Points', 'Life Category', 'Request Type', 'Status', 'Submitted Date', 'Action']} rows={data.items.map((r: any) => [r.user_name || '-', r.email || '-', r.current_level || '-', r.total_points || 0, r.life_category || '-', r.request_type, <Badge value={statusLabel(r.status)} />, date(r.created_at), <LinkButton label="View" onClick={() => navigate(`/admin/support-requests/${r.id}`)} />])} />
          <Pagination page={query.page} pageCount={data.pageCount} onPage={(page: number) => setQuery({ ...query, page })} />
        </Panel>
      )}
    </PageFrame>
  );
}

function SupportDetails({ id }: { id: string }) {
  const { data, loading, error, reload } = useLoad(() => getAdminSupportRequest(id), [id]);
  const setStatus = async (status: string) => { await updateAdminSupportStatus(id, status); reload(); };
  if (loading || error) return <PageFrame title="Support Request"><StateView loading={loading} error={error} onRetry={reload} /></PageFrame>;
  return (
    <PageFrame title="Support Request" action={<LinkButton label="Back" onClick={() => navigate('/admin/support-requests')} />}>
      <div className="two-col">
        <Panel title="User Information"><Info rows={[['User', data.user_name || '-'], ['Email', data.email || '-'], ['Level', data.current_level || '-'], ['Points', data.total_points || 0], ['Life Category', data.life_category || '-']]} /></Panel>
        <Panel title="Request Information"><Info rows={[['Request Type', data.request_type], ['Subject', data.subject || '-'], ['Created Date', date(data.created_at)], ['Current Status', statusLabel(data.status)], ['Message', data.message]]} /></Panel>
      </div>
      <Panel title="Update Status"><div className="inline-actions">{['pending', 'in_progress', 'resolved'].map((s) => <LinkButton key={s} label={statusLabel(s)} onClick={() => setStatus(s)} />)}</div></Panel>
    </PageFrame>
  );
}

function PlayStorePage() {
  const { data, loading, error, reload } = useLoad(getAdminPlayStoreStats);
  const installValue = loading ? 'Loading...' : error ? 'Unavailable' : playStoreInstallValue(data);
  return (
    <PageFrame title="Play Store">
      {error ? <div className="notice"><div className="notice-title">Something needs attention</div><p className="error">{String(error)}</p><LinkButton label="Retry" onClick={reload} /></div> : null}
      {!loading && !error && data?.configured === false && <div className="notice"><div className="notice-title">{playStoreNoticeTitle(data.reason)}</div><p className="muted">{data.message}</p></div>}
      <div className="card-grid">
        <MetricCard label="Total Installs" value={installValue} Icon={Play} />
      </div>
    </PageFrame>
  );
}

function SettingsPage({ admin }: any) {
  return <PageFrame title="Settings"><Panel title="Admin Account"><Info rows={[['Admin Email', admin.email], ['Role', admin.role], ['Authentication', 'Managed by Supabase admin account credentials']]} /></Panel></PageFrame>;
}

function PageFrame({ title, subtitle, action, children }: any) {
  return <><div className="page-header-admin"><div><h1>{title}</h1>{subtitle ? <p>{subtitle}</p> : null}</div>{action}</div>{children}</>;
}

function Panel({ title, children }: any) {
  return <section className="panel"><h2>{title}</h2>{children}</section>;
}

function MetricCard({ label, value: metricValue, Icon }: any) {
  return <div className="metric"><div><div className="metric-label">{label}</div><div className="metric-value">{metricValue}</div></div><div className="icon-bubble"><Icon size={20} color={C.accent} /></div></div>;
}

function DataTable({ columns, rows }: { columns: string[]; rows: any[][] }) {
  if (!rows.length) return <Empty text="No records found." />;
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead><tr>{columns.map((c) => <th key={c} style={{ width: colWidth(c) }}>{c}</th>)}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, i) => <td key={i} style={{ width: colWidth(columns[i]) }}>{React.isValidElement(cell) ? cell : <span className="td-text">{String(cell ?? '-')}</span>}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function Filters({ query, setQuery, fields }: any) {
  return (
    <div className="filters">
      {fields.includes('search') && <label className="search-box"><Search size={17} color={C.muted} /><input placeholder="Search" value={query.search ?? ''} onChange={(e) => setQuery({ ...query, search: e.target.value, page: 1 })} /></label>}
      {fields.filter((f: string) => f !== 'search').map((field: string) => <input key={field} className="filter-chip" placeholder={labelize(field)} value={String(query[field] ?? '')} onChange={(e) => setQuery({ ...query, [field]: e.target.value, page: 1 })} />)}
    </div>
  );
}

function Pagination({ page, pageCount, onPage }: any) {
  return <div className="pagination"><LinkButton label="Previous" onClick={() => page > 1 && onPage(page - 1)} /><span className="muted">Page {page} of {Math.max(1, pageCount)}</span><LinkButton label="Next" onClick={() => page < pageCount && onPage(page + 1)} /></div>;
}

function ProgressRow({ label, value: rowValue, pct }: any) {
  return <div className="progress-row"><div className="progress-labels"><span className="info-key">{label}</span><span className="info-value">{rowValue}</span></div><div className="progress-track"><div className="progress-fill" style={{ width: `${Math.round(pct * 100)}%` }} /></div></div>;
}

function Info({ rows }: any) {
  return <div>{rows.map(([key, val]: any) => <div key={key} className="info-row"><div className="info-key">{key}</div><div className="info-value">{String(val ?? '-')}</div></div>)}</div>;
}

function Badge({ value: badgeValue }: any) {
  const text = String(badgeValue ?? '-');
  const danger = /failed|disabled/.test(text.toLowerCase());
  const warning = /pending|created|progress/.test(text.toLowerCase());
  return <span className={`badge ${danger ? 'badge-danger' : ''} ${warning ? 'badge-warning' : ''}`}>{text}</span>;
}

function LinkButton({ label, onClick }: any) {
  return <button type="button" className="link-button" onClick={onClick}>{label}</button>;
}

function StateView({ loading, error, onRetry }: any) {
  if (loading) return <Centered><Spinner /></Centered>;
  return <div className="notice"><div className="notice-title">Something needs attention</div><p className="error">{String(error)}</p><LinkButton label="Retry" onClick={onRetry} /></div>;
}

function Empty({ text }: any) {
  return <p className="muted">{text}</p>;
}

function Centered({ children }: any) {
  return <div className="centered">{children}</div>;
}

function Spinner() {
  return <div className="spinner" aria-label="Loading" />;
}

function useLoad<T>(loader: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const reload = () => {
    setLoading(true);
    setError('');
    loader().then(setData).catch((err) => setError(err?.message ?? 'Request failed.')).finally(() => setLoading(false));
  };
  useEffect(reload, deps);
  return { data: data as T, loading, error, reload };
}

function useCompact() {
  const [compact, setCompact] = useState(window.innerWidth < 900);
  useEffect(() => {
    const onResize = () => setCompact(window.innerWidth < 900);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return compact;
}

const money = (amount: number, currency = 'INR') => `${currency === 'INR' ? 'Rs ' : `${currency} `}${((amount ?? 0) / 100).toLocaleString()}`;
const value = (v: any) => v === null || v === undefined || v === '' ? 'Not configured' : v;
const playStoreReportReasons = new Set(['GOOGLE_PLAY_REPORT_NOT_AVAILABLE', 'GOOGLE_PLAY_REPORT_INVALID', 'GOOGLE_PLAY_METRIC_NOT_AVAILABLE']);
const playStoreUnavailableReasons = new Set(['GOOGLE_PLAY_PERMISSION_DENIED', 'GOOGLE_PLAY_BUCKET_NOT_FOUND', 'GOOGLE_PLAY_API_UNAVAILABLE']);
const playStoreInstallValue = (stats: any) => {
  if (!stats) return 'Unavailable';
  if (stats.configured && stats.totalInstalls !== null && stats.totalInstalls !== undefined) return stats.totalInstalls;
  if (playStoreReportReasons.has(stats.reason)) return 'No report data';
  if (playStoreUnavailableReasons.has(stats.reason)) return 'Unavailable';
  return 'Not configured';
};
const playStoreNoticeTitle = (reason?: string) => {
  if (playStoreReportReasons.has(reason ?? '')) return 'No report data';
  if (playStoreUnavailableReasons.has(reason ?? '')) return 'Unavailable';
  return 'Not configured';
};
const date = (v: any) => v ? new Date(v).toLocaleDateString() : '-';
const time = (v: any) => v ? new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';
const statusLabel = (v: string) => ({ paid: 'Successful', created: 'Pending', in_progress: 'In Progress' } as any)[v] ?? labelize(v);
const labelize = (v: string) => v.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').replace(/\b\w/g, (c) => c.toUpperCase()).trim();
const avatar = (u: any) => <div className="avatar">{String(u.name || u.email || '?').slice(0, 1).toUpperCase()}</div>;
const activityLabel = (a: any) => a.status === 'completed' || a.status === 'easier_completed' ? `Completed Dare: ${a.dare_title ?? ''}` : labelize(a.status);
const colWidth = (c: string) => c.length > 16 ? 170 : c === 'Action' ? 150 : 130;

createRoot(document.getElementById('admin-root')!).render(<AdminApp />);
