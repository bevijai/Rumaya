# Rumaya Helper Marketplace PRD

Status: Draft for implementation  
Market: Singapore  
Pilot helper source countries: Indonesia, the Philippines, and Myanmar  
Last updated: 2026-10-01

## 1. Product Summary

Rumaya will add a verified helper marketplace to the existing employer-helper platform. Helpers and licensed employment agencies can create helper profiles. Rumaya validates each profile, calculates evidence-based category scores, and publishes privacy-controlled listings.

Employers can browse anonymized profiles without signing in. After creating and verifying an employer profile, they can save requirements, receive personalized matches, shortlist helpers, and connect with the helper's representing agency. Employers do not bypass agencies or receive helper contact details during the initial process.

The marketplace remains part of Rumaya, with role-based experiences for helpers, employers, agency users, and Rumaya validators.

## 2. Goals

- Help Singapore employers discover suitable, verified helpers.
- Give helpers a fair, accessible way to present their experience and preferences.
- Give licensed agencies qualified employer leads and tools to manage placement workflows.
- Keep agencies in the regulated placement process while preventing helper lock-in.
- Reduce stale, duplicate, fraudulent, and unconsented listings.
- Create a traceable path from discovery through interview, hold, and confirmed placement.

## 3. Product Principles

- Helpers do not pay Rumaya for registration, verification, publishing, representation, or placement.
- A helper controls consent to publication and agency representation.
- Profile quality must not depend on education level, writing quality, device quality, or digital literacy.
- Nationality, religion, marital status, and other protected or irrelevant personal characteristics do not increase or reduce the Rumaya score.
- Rumaya records evidence and consent without presenting itself as a government authority.
- Agencies cannot receive leads unless their Singapore MOM Employment Agency licence is verified and active.
- Sensitive identity documents are never part of the public listing.

## 4. Users and Roles

### 4.1 Helper

- Self-registers or completes assisted registration.
- Reviews and confirms all profile information entered on her behalf.
- Consents to profile publication and agency representation.
- Maintains availability and placement preferences.
- Accepts or rejects representation requests and interview requests.
- Acknowledges interview outcomes and placement decisions.

### 4.2 Employer

- Browses anonymized listings without an account.
- Registers and verifies an account before shortlisting or contacting an agency.
- Creates a household and helper-requirements profile.
- Receives match levels and reasons.
- Shortlists helpers and requests interviews through the representing agency.
- Acknowledges interview outcomes and placement decisions.

### 4.3 Agency User

- Belongs to a verified, MOM-licensed Singapore employment agency.
- Creates helper profiles with the helper's subsequent consent, or requests representation of self-registered helpers.
- Sees professional profile details and evidence-backed category scores.
- Receives enquiries only for helpers represented by the agency.
- Manages interview scheduling, holds, milestones, and placement status.
- Cannot approve a profile submitted by its own agency.

### 4.4 Rumaya Validator/Admin

- Verifies agencies, profiles, documents, consent, and availability.
- Conducts pilot validation calls in the helper's preferred language.
- Approves, rejects, suspends, or requests profile corrections.
- Reviews automated score inputs and records reasons for manual adjustments.
- Handles duplicate profiles, representation disputes, reports, and audit requests.

## 5. Pilot Scope

- Destination market: Singapore.
- Helper sources: Indonesia, the Philippines, and Myanmar, subject to current MOM eligibility rules.
- Participants: 3-5 invitation-only agencies and 50-100 helpers.
- Agencies are manually approved before uploading profiles or receiving leads.
- Every pilot helper receives a short validation call before publication.
- Agency usage is free during the controlled pilot.

## 6. Registration and Onboarding

### 6.1 Helper Registration Methods

Rumaya supports:

1. Helper self-registration.
2. Assisted registration by a verified agency.
3. Assisted registration by a future Rumaya-approved local onboarding partner.

Assisted registration never replaces helper consent. The helper must personally confirm identity, profile contents, publication consent, and representation terms by an approved verification method.

Onboarding must provide:

- Indonesian, Tagalog, and Burmese language support for the pilot.
- Short, step-by-step forms with save and resume.
- Plain-language explanations and optional voice guidance.
- OTP verification and account recovery paths that account for phone-number changes.
- A way for a validator to correct information with the helper's confirmation.

### 6.2 Employer Registration

An employer profile includes:

- Name and verified phone or email.
- Country and general Singapore location.
- Household composition.
- Helper requirements and preferred start date.
- Budget or salary range.
- Language and skill preferences.
- Communication and privacy consent.

The exact home address remains private during discovery and initial contact.

### 6.3 Agency Registration

Agency onboarding includes:

- Legal business name and contact details.
- MOM Employment Agency licence number.
- Authorised agency users and roles.
- Licence verification date and status.
- Terms acceptance and privacy commitments.
- Periodic licence revalidation.

## 7. Helper Profiles

Profiles support both:

- Overseas helpers seeking a Singapore placement.
- Helpers already in Singapore seeking an approved transfer.

These appear as separate availability categories because documents, timelines, and placement steps differ.

Profile data includes:

- Public display identity that does not expose government identifiers.
- Source country and current location category.
- Languages spoken.
- Employment history and relevant experience.
- Childcare, infant care, eldercare, disability care, cooking, pet care, and household skills.
- Training, certifications, and verified references.
- Availability date and overseas/transfer status.
- Placement and work preferences.
- Verification badges and last verified date.
- Optional verified video, audio, or assisted introduction.

Introduction formats receive equal completeness points. Their production quality, appearance, accent, or presentation style does not affect skills or suitability scoring.

## 8. Profile Validation

The validation pipeline is:

1. Automated completeness and format checks.
2. Phone OTP and duplicate-profile detection.
3. Document and evidence review.
4. Short local-language validation call during the pilot.
5. Automated score calculation.
6. Human review and approval by Rumaya.
7. Publication with an audit trail.

Agencies may submit evidence but cannot approve profiles. Material changes to identity, work history, documents, availability, or representation trigger re-review.

Every helper must reconfirm availability every 30 days. Rumaya sends reminders before the due date and automatically hides an overdue profile until availability is reconfirmed.

## 9. Scoring and Matching

### 9.1 Agency Score

The initial score is out of 100:

| Category | Points |
| --- | ---: |
| Identity and document verification | 30 |
| Skills and relevant experience | 30 |
| References and validation interview | 20 |
| Availability and placement readiness | 15 |
| Profile completeness | 5 |

A verified video, audio, or assisted introduction can contribute up to 2 of the 5 profile-completeness points.

Agencies see category scores and supporting verification signals rather than only one unexplained rank. Every manual adjustment requires a reason, actor, and timestamp. Scoring versions must be retained so historical decisions remain explainable when weights change after the pilot.

### 9.2 Employer Matching

Employers do not see the agency's numerical category scores. They see:

- Verification badges.
- Relevant profile details.
- A personalized match level, such as Strong Match.
- Plain-language match reasons and unmet preferences.

Matching uses the employer's saved requirements, including care needs, cooking, pets, languages, experience, availability, salary range, and overseas/transfer preference.

## 10. Visibility and Privacy

### 10.1 Anonymous Visitor

- Can browse anonymized profile summaries.
- Cannot shortlist, enquire, access introductions, or view professional details.

### 10.2 Verified Employer

- Can view approved professional summaries, verified introductions, badges, and personalized matches.
- Cannot access identity documents, direct contact details, or internal category scores.

### 10.3 Verified Representing Agency

- Can access professional details needed for representation and placement.
- Receives employer enquiries for represented helpers.
- Access to sensitive documents is limited by purpose and role.

### 10.4 Rumaya Validator

- Can access sensitive documents only for validation, compliance, dispute handling, and authorised support.
- All sensitive access is audited.

## 11. Agency Representation

- A helper can have one active representing agency at a time.
- A verified agency may request to represent an unrepresented helper.
- The helper must explicitly accept the request.
- Agency-created profiles remain unpublished until the helper confirms the profile and representation.
- A helper may request a transfer through a controlled process with notice, dispute handling, and a complete audit trail.
- Employers enquiring about a helper are routed only to that helper's active representing agency.
- Employers cannot use Rumaya to bypass the agency and directly obtain helper contact details.

## 12. Discovery and Enquiry Flow

1. Employer browses anonymized profiles.
2. Employer registers or signs in before shortlisting.
3. Employer completes or updates household requirements.
4. Rumaya displays personalized matches and reasons.
5. Employer selects a helper and submits an enquiry.
6. Rumaya routes the enquiry only to the helper's representing agency.
7. Agency accepts, declines, or requests clarification.
8. Agency coordinates an interview through Rumaya.

Agency dashboards show profile views, shortlists, enquiries, response time, interviews, holds, and placement conversion.

## 13. Shortlist, Hold, and Placement States

The core lifecycle is:

`Draft -> Pending validation -> Published -> Shortlisted -> Interviewing -> Held -> Placement confirmed`

Alternative or recovery states include:

`Changes requested`, `Rejected`, `Hidden`, `Suspended`, `Hold expired`, `Placement cancelled`, and `Placed`.

Multiple employers or agencies may shortlist an available helper. After mutual interest is recorded, the active agency may place a seven-day exclusive hold. A hold can be extended only when the agency records a valid milestone, such as paperwork submission or an appointment. Expired or cancelled holds return the helper to the appropriate available state.

State changes record the actor, timestamp, reason, and related evidence.

## 14. Interviews

The intended flow is:

`Shortlist -> Agency acceptance -> Rumaya virtual interview -> Mutual interest -> Face-to-face meeting -> Hold/placement`

Rumaya will eventually provide built-in live video through a managed video provider rather than maintaining custom WebRTC infrastructure.

Interview capabilities include:

- Agency-managed interview requests and scheduling.
- Invitations, reminders, rescheduling, and attendance status.
- Employer, helper, and optional agency participation.
- Hidden personal contact details during the initial stage.
- Separate post-interview outcomes from each party.
- Agency confirmation after employer and helper acknowledgements.

### 14.1 Recording

- Recording is optional, not automatic.
- Recording starts only after every participant explicitly consents.
- The call continuously displays a recording indicator.
- Participants receive recording confirmation afterward.
- Recordings are encrypted and access-controlled.
- A recording is deleted when the placement is completed or cancelled, with an absolute maximum retention of 90 days.
- Withdrawing from a placement does not remove immutable consent and access audit events, but it does trigger the applicable recording deletion policy.

## 15. Interview Acknowledgement and Paperwork

Rumaya generates an Interview Acknowledgement containing:

- Interview date, time, method, and participants.
- Attendance status.
- Whether recording was requested and unanimously consented to.
- Separate employer and helper outcomes.
- Agency confirmation.
- Digital timestamps and audit history.

The acknowledgement states that the parties completed an interview and records their expressed outcome. It must not state that employment was accepted unless both parties separately confirm that decision.

The acknowledgement can be attached to later placement paperwork and exported as a human-readable document.

## 16. Notifications

Rumaya sends role-appropriate in-app notifications and, where consented, email, SMS, or messaging notifications for:

- Profile corrections and approval.
- Representation requests and changes.
- Availability reconfirmation.
- New enquiries and agency responses.
- Interview invitations, reminders, and changes.
- Recording consent and availability.
- Interview outcome acknowledgements.
- Hold start, milestone deadlines, expiry warnings, and release.
- Placement confirmation or cancellation.

Notifications must use the recipient's supported preferred language where possible.

## 17. Commercial Model

### Pilot

- Free for helpers.
- Free for invited agencies.
- Employer browsing, matching, and enquiries are free.

### Post-Pilot Direction

- Agency subscription with usage limits.
- Optional paid qualified-employer leads or higher usage tiers.
- No Rumaya placement fee charged to helpers.
- Pricing is introduced only after pilot metrics demonstrate agency value.

## 18. Safety, Compliance, and Audit Requirements

- Verify current MOM source-country eligibility before accepting a helper application.
- Verify agency licence status before activation and periodically thereafter.
- Obtain explicit, versioned consent for publication, representation, interviews, and recordings.
- Encrypt sensitive data in transit and at rest.
- Store documents and recordings outside the application server in access-controlled object storage.
- Apply least-privilege, role-based access to profiles, documents, and recordings.
- Maintain immutable audit events for approvals, score changes, access, consent, holds, and placement states.
- Provide profile correction, account recovery, data export, and deletion-request workflows subject to legal retention duties.
- Provide reporting, suspension, and dispute-handling workflows.
- Complete Singapore legal and PDPA review before the public launch.

## 19. Delivery Phases

### Phase 1: Marketplace Foundation

- Role and permission model.
- Agency onboarding and licence verification.
- Helper self-registration and assisted registration.
- Profile validation, scoring, approval, and monthly availability checks.
- Employer profile and requirements.
- Anonymous browsing, verified search, matching, and agency enquiries.

### Phase 2: Placement Workflow

- Shortlists and agency responses.
- Representation requests and transfers.
- Seven-day holds, milestones, expiry, and release.
- Interview scheduling and reminders.
- Digital interview outcomes and acknowledgements.

### Phase 3: Built-In Video and Paperwork

- Managed video-provider integration inside Rumaya.
- Unanimous recording consent and visible recording state.
- Recording retention and deletion automation.
- Interview Acknowledgement generation and placement-paperwork attachment.

### Phase 4: Controlled Pilot

- Invite 3-5 approved agencies.
- Onboard 50-100 helpers.
- Conduct validation calls for every pilot helper.
- Monitor operations, fairness, costs, conversion, and support load.
- Recalibrate scoring and workflows before public expansion.

## 20. Pilot Success Metrics

- Profile completion and validation pass rates.
- Average validation time and cost per approved profile.
- Percentage of profiles with current availability confirmation.
- Duplicate, fraud, and unconsented-profile detection rates.
- Employer search-to-shortlist and shortlist-to-enquiry conversion.
- Agency response time and enquiry acceptance rate.
- Interview attendance and mutual-interest rates.
- Hold expiry and placement conversion rates.
- Helper withdrawal, representation-transfer, complaint, and dispute rates.
- Match quality feedback from helpers, employers, and agencies.
- Outcome differences across onboarding method, source country, language, and introduction format to detect scoring bias.

## 21. Out of Scope for the Initial Pilot

- Open self-service agency registration.
- Multiple simultaneous representing agencies for one helper.
- Direct employer-helper contact before the agreed disclosure stage.
- Public numerical helper rankings.
- Mandatory profile-introduction videos.
- Automatic or non-consensual interview recording.
- Custom-built WebRTC infrastructure.
- Expansion beyond Singapore employers and agencies.
- Helper-facing fees charged by Rumaya.

## 22. Decisions Required During Technical Design

- Managed video and recording provider.
- Identity and document-verification provider or manual process.
- Object storage and encryption-key management.
- Exact score evidence rules within each category.
- Employer match algorithm and explanation rules.
- Agency subscription limits and post-pilot pricing.
- Detailed legal retention schedule beyond interview recordings.
- Operational staffing and language coverage for validation calls.