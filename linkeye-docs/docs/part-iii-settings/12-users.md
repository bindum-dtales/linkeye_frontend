# 12. Users

Users controls who can access LinkEye and what they can see once inside.

## Managing Users

- **Add New User:** opens a form to create a new account.
- **Edit User:** updates an existing account's details.
- **Map User → Business Units / Access:** scopes what the user can see by business unit and access level.
- **Delete User:** removes the account.

---

**Q. How do I setup role-based access for a new NOC tech?**

1. Go to Settings → Users.
2. Select **Add New User** and complete the form with the technician's name, email, and login method.
3. Open **Map User → Business Units / Access** for the new account.
4. Scope the account to only the Business Units the technician is
   responsible for — this keeps their Overview, Agentic NetOps, and
   Infrastructure views limited to relevant sites rather than the full
   tenant.
5. Set their access level to match a NOC role — typically operational
   visibility and RCA/Compliance interaction without Settings-level
   administrative rights.
6. Save. The technician's access takes effect on next login; confirm by
   asking them to sign in and check that only their assigned Business
   Units appear on Overview and Topology.

If the technician needs to manage alert recipients or escalation
contacts as part of their role, also review
[Chapter 17 (Alert Configuration)](17-alert-configuration.md) for the
specific permissions that touch escalation matrices.
