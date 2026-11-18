# Assignment Workflow TODO

- [x] Raise manager assignment select dropdown z-index so options render above the dialog.
- [x] Normalize manager assignment payloads to send `writerId` and accept legacy `freelancerId` server-side.
- [x] Update assignment response API to validate against `assignedFreelancerId` and clear freelancer response flags.
- [x] Align freelancer accept/decline endpoints with typed database access and notification recipients.
- [ ] QA the manager assignment modal in the manager dashboard to confirm the dropdown renders correctly.
- [ ] QA the freelancer acceptance popup end-to-end using the seeded freelancer account.
- [ ] Monitor notifications to ensure managers/admins receive acceptance/decline alerts with correct recipients.
