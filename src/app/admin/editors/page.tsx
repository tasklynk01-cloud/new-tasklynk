"use client";
import { safeApiFetch } from '@/lib/client-api-helpers';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context-v2';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InviteEditorDialog } from '@/components/invite-editor-dialog';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Ban,
	CheckCircle2,
	MailPlus,
	PenSquare,
	RefreshCw,
	Search,
	ShieldCheck,
	UsersRound,
} from 'lucide-react';
import { toast } from 'sonner';

type EditorProfile = {
	specialization?: string | null;
	yearsExperience?: number | null;
	ordersTouched?: number | null;
	clientSatisfactionRate?: number | null;
	isProfileComplete?: boolean;
};

type Editor = {
	id: number;
	name: string;
	email: string;
	phone?: string | null;
	displayId?: string | null;
	approved: boolean;
	status: string;
	createdAt?: string;
	profile?: EditorProfile | null;
};

const statusOptions = [
	{ label: 'All status', value: 'all' },
	{ label: 'Pending', value: 'pending' },
	{ label: 'Approved', value: 'approved' },
	{ label: 'Suspended', value: 'suspended' },
	{ label: 'Rejected', value: 'rejected' },
];

export default function AdminEditorsPage() {
	const { user, loading } = useAuth();
	const router = useRouter();
	const [editors, setEditors] = useState<Editor[]>([]);
	const [loadingData, setLoadingData] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState('all');
	const [inviteOpen, setInviteOpen] = useState(false);
	const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

	useEffect(() => {
		if (!loading) {
			if (!user || user.role !== 'admin') {
				router.replace('/');
			} else {
				fetchEditors();
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user, loading]);

	const fetchEditors = async () => {
		try {
			setLoadingData(true);
			const response = await safeApiFetch('/api/admin/editors', {
				credentials: 'include',
			});

			if (!response.ok) {
				const error = await response.json().catch(() => ({}));
				throw new Error(error.error || 'Failed to load editors');
			}

			const data = await response.json();
			setEditors(data.editors || []);
		} catch (error) {
			console.error('Failed to fetch editors:', error);
			toast.error(error instanceof Error ? error.message : 'Failed to load editors');
		} finally {
			setLoadingData(false);
		}
	};

	const handleStatusChange = async (
		editorId: number,
		action: 'approve' | 'suspend' | 'unsuspend' | 'reject'
	) => {
		try {
			setActionLoadingId(editorId);

			let endpoint = '';
			let method: 'POST' | 'PATCH' = 'POST';
			let body: BodyInit | undefined;

			if (action === 'approve') {
				endpoint = `/api/users/${editorId}/approve`;
			} else if (action === 'suspend') {
				endpoint = `/api/users/${editorId}/suspend`;
				method = 'PATCH';
				body = JSON.stringify({ duration: 7, reason: 'Suspended by admin' });
			} else if (action === 'unsuspend') {
				endpoint = `/api/users/${editorId}/unsuspend`;
				method = 'PATCH';
			} else if (action === 'reject') {
				endpoint = `/api/users/${editorId}/reject`;
			}

			if (!endpoint) return;

			const response = await safeApiFetch(endpoint, {
				method,
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				...(body ? { body } : {}),
			});

			if (!response.ok) {
				const error = await response.json().catch(() => ({}));
				throw new Error(error.error || error.message || 'Failed to update status');
			}

			toast.success('Editor status updated');
			await fetchEditors();
		} catch (error) {
			console.error('Status change error:', error);
			toast.error(error instanceof Error ? error.message : 'Failed to update status');
		} finally {
			setActionLoadingId(null);
		}
	};

	const filteredEditors = useMemo(() => {
		return editors.filter((editor) => {
			const status = editor.status || 'pending';
			const matchesStatus =
				statusFilter === 'all' ||
				status === statusFilter ||
				(statusFilter === 'approved' && (status === 'approved' || status === 'active'));

			const searchValue = searchTerm.trim().toLowerCase();
			const matchesSearch = !searchValue
				? true
				: [editor.name, editor.email, editor.displayId]
						.filter(Boolean)
						.some((value) => value!.toLowerCase().includes(searchValue));

			return matchesStatus && matchesSearch;
		});
	}, [editors, searchTerm, statusFilter]);

	const stats = useMemo(() => {
		return {
			total: editors.length,
			pending: editors.filter((editor) => (editor.status || 'pending') === 'pending').length,
			approved: editors.filter((editor) => ['approved', 'active'].includes(editor.status || '')).length,
			suspended: editors.filter((editor) => editor.status === 'suspended').length,
		};
	}, [editors]);

	const getStatusBadge = (status: string) => {
		const map: Record<string, { label: string; className: string }> = {
			pending: {
				label: 'Pending',
				className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
			},
			approved: {
				label: 'Approved',
				className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100',
			},
			active: {
				label: 'Active',
				className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100',
			},
			suspended: {
				label: 'Suspended',
				className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
			},
			rejected: {
				label: 'Rejected',
				className: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100',
			},
		};

		const config = map[status] || map.pending;
		return <Badge className={`${config.className} rounded-xl text-xs`}>{config.label}</Badge>;
	};

	if (loading || !user) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
			</div>
		);
	}

	return (
		<div className="w-full p-4 sm:p-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
				<div>
					<div className="flex items-center gap-3 mb-2">
						<PenSquare className="w-6 h-6 text-primary" />
						<h1 className="text-2xl sm:text-3xl font-semibold">Editor Management</h1>
					</div>
					<p className="text-muted-foreground text-sm sm:text-base">
						Review editor performance, manage statuses, and send new invitations
					</p>
				</div>
				<Button onClick={() => setInviteOpen(true)} className="gap-3">
					<MailPlus className="w-4 h-4" />
					Invite Editor
				</Button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
				<Card>
					<CardHeader className="pb-2">
						<CardDescription className="text-xs uppercase tracking-wide">Total</CardDescription>
						<CardTitle className="text-3xl">{stats.total}</CardTitle>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardDescription className="text-xs uppercase tracking-wide text-amber-600">
							Pending
						</CardDescription>
						<CardTitle className="text-3xl text-amber-600">{stats.pending}</CardTitle>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardDescription className="text-xs uppercase tracking-wide text-emerald-600">
							Approved
						</CardDescription>
						<CardTitle className="text-3xl text-emerald-600">{stats.approved}</CardTitle>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardDescription className="text-xs uppercase tracking-wide text-red-600">
							Suspended
						</CardDescription>
						<CardTitle className="text-3xl text-red-600">{stats.suspended}</CardTitle>
					</CardHeader>
				</Card>
			</div>

			<Card className="mb-6">
				<CardContent className="pt-6">
					<div className="flex flex-col gap-4 md:flex-row">
						<div className="flex-1">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
								<Input
									placeholder="Search by name, email, or ID"
									className="pl-9"
									value={searchTerm}
									onChange={(event) => setSearchTerm(event.target.value)}
								/>
							</div>
						</div>
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger className="md:w-48">
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								{statusOptions.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Button variant="outline" onClick={fetchEditors} className="gap-3">
							<RefreshCw className="w-4 h-4" />
							Refresh
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-3">
						<ShieldCheck className="w-5 h-5 text-primary" />
						Editors ({filteredEditors.length})
					</CardTitle>
					<CardDescription>All editors with their specialization and performance stats</CardDescription>
				</CardHeader>
				<CardContent>
					{loadingData ? (
						<div className="py-12 text-center">
							<div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
							<p className="text-sm text-muted-foreground mt-4">Loading editors...</p>
						</div>
					) : filteredEditors.length === 0 ? (
						<div className="py-12 text-center text-muted-foreground">
							<UsersRound className="w-12 h-12 mx-auto mb-4" />
							No editors match your search.
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Editor</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Expertise</TableHead>
										<TableHead>Performance</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredEditors.map((editor) => (
										<TableRow key={editor.id} className="hover:bg-muted/50">
											<TableCell>
												<div className="flex flex-col gap-1">
													<span className="font-semibold">{editor.name}</span>
													<span className="text-sm text-muted-foreground">{editor.email}</span>
													<div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
														{editor.displayId && <Badge variant="outline">{editor.displayId}</Badge>}
														{editor.phone && <span>?? {editor.phone}</span>}
													</div>
												</div>
											</TableCell>
											<TableCell>{getStatusBadge(editor.status)}</TableCell>
											<TableCell>
												<div className="space-y-1">
													<p className="font-medium text-sm">
														{editor.profile?.specialization || 'Not provided'}
													</p>
													<p className="text-xs text-muted-foreground">
														{editor.profile?.yearsExperience != null
															? `${editor.profile.yearsExperience}+ yrs experience`
															: 'Experience pending'}
													</p>
												</div>
											</TableCell>
											<TableCell>
												<div className="text-sm">
													<p>
														Orders touched:{' '}
														<span className="font-semibold">
															{editor.profile?.ordersTouched ?? 0}
														</span>
													</p>
													<p>
														Satisfaction:{' '}
														<span className="font-semibold">
															{editor.profile?.clientSatisfactionRate
																? `${editor.profile.clientSatisfactionRate}%`
																: 'N/A'}
														</span>
													</p>
												</div>
											</TableCell>
											<TableCell className="text-right">
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															size="sm"
															variant="outline"
															disabled={actionLoadingId === editor.id}
														>
															Manage
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end" className="w-44">
														{(editor.status === 'pending' || editor.status === 'rejected') && (
															<DropdownMenuItem
																onClick={() => handleStatusChange(editor.id, 'approve')}
															>
																<CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
																Approve
															</DropdownMenuItem>
														)}
														{(editor.status === 'approved' || editor.status === 'active') && (
															<DropdownMenuItem
																onClick={() => handleStatusChange(editor.id, 'suspend')}
															>
																<Ban className="w-4 h-4 mr-2 text-red-600" />
																Suspend
															</DropdownMenuItem>
														)}
														{editor.status === 'suspended' && (
															<DropdownMenuItem
																onClick={() => handleStatusChange(editor.id, 'unsuspend')}
															>
																<ShieldCheck className="w-4 h-4 mr-2 text-primary" />
																Unsuspend
															</DropdownMenuItem>
														)}
														{editor.status === 'pending' && (
															<DropdownMenuItem
																onClick={() => handleStatusChange(editor.id, 'reject')}
															>
																Reject
															</DropdownMenuItem>
														)}
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			<InviteEditorDialog
				open={inviteOpen}
				onOpenChange={setInviteOpen}
				onInviteSuccess={fetchEditors}
			/>
		</div>
	);
}
