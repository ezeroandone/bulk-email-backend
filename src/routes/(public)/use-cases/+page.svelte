<svelte:head>
  <title>Use Cases — MergeMail</title>
  <meta name="description" content="See how schools, NGOs, associations, event organizers, and HR teams use MergeMail to send personalized bulk emails with attachments." />
  <meta property="og:title" content="Use Cases — MergeMail" />
  <meta property="og:description" content="Certificate delivery, membership notifications, event invitations, and application status updates — all automated with MergeMail." />
</svelte:head>

<div class="max-w-4xl mx-auto px-4 py-16">
  <div class="text-center mb-14">
    <h1 class="text-4xl font-extrabold text-neutral-900 mb-4">Use Cases</h1>
    <p class="text-xl text-neutral-600 max-w-2xl mx-auto">
      Teams across Nigeria and beyond use MergeMail to save hours on repetitive, personalized communications.
    </p>
  </div>

  <!-- Certificate Delivery -->
  <article class="mb-16 p-8 rounded-2xl border border-neutral-200 bg-white shadow-sm">
    <div class="flex items-center gap-4 mb-6">
      <div class="w-14 h-14 rounded-xl bg-yellow-100 flex items-center justify-center flex-shrink-0">
        <span class="material-symbols-outlined text-yellow-600" style="font-size:2rem">workspace_premium</span>
      </div>
      <div>
        <h2 class="text-2xl font-bold text-neutral-900">Certificate Delivery</h2>
        <p class="text-sm text-neutral-500 mt-1">Schools, universities, NGOs, professional bodies</p>
      </div>
    </div>
    <p class="text-neutral-700 leading-relaxed mb-4">
      Every year, thousands of organizations issue completion certificates to graduates, workshop participants, or award recipients.
      The traditional workflow involves opening each certificate individually, adding the name, exporting to PDF, and attaching it to a one-by-one email — a process that takes hours for even a modest cohort.
    </p>
    <p class="text-neutral-700 leading-relaxed mb-4">
      With MergeMail, the process collapses to three actions: upload the participant list (spreadsheet with name, email, ID, course title),
      upload the certificate DOCX or PDF template (with <code class="bg-neutral-100 border rounded px-1 text-sm">{'{{participant_name}}'}</code>,
      <code class="bg-neutral-100 border rounded px-1 text-sm">{'{{course_title}}'}</code>, and
      <code class="bg-neutral-100 border rounded px-1 text-sm">{'{{completion_date}}'}</code> placeholders),
      then launch the campaign. Each participant receives an email with their own uniquely generated certificate attached as a PDF.
    </p>
    <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
      <h3 class="text-sm font-semibold text-yellow-900 mb-2">Example workflow</h3>
      <ol class="space-y-1 text-sm text-yellow-800 list-decimal list-inside">
        <li>Export the participant list from your LMS or registration form as XLSX.</li>
        <li>Design the certificate in Word: logo, border, body with placeholders, signature line.</li>
        <li>Upload both to MergeMail, map columns to placeholders, configure your institution's email SMTP.</li>
        <li>Preview three sample certificates, then launch. 500 certificates delivered in under 30 minutes.</li>
      </ol>
    </div>
    <p class="text-sm text-neutral-500">
      <strong>Credit cost:</strong> 1 credit per certificate email. A cohort of 500 = 500 credits.
    </p>
  </article>

  <!-- Membership Notifications -->
  <article class="mb-16 p-8 rounded-2xl border border-neutral-200 bg-white shadow-sm">
    <div class="flex items-center gap-4 mb-6">
      <div class="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
        <span class="material-symbols-outlined text-blue-600" style="font-size:2rem">group</span>
      </div>
      <div>
        <h2 class="text-2xl font-bold text-neutral-900">Membership Notifications</h2>
        <p class="text-sm text-neutral-500 mt-1">Professional associations, alumni clubs, subscription organizations</p>
      </div>
    </div>
    <p class="text-neutral-700 leading-relaxed mb-4">
      Professional associations, alumni bodies, and subscription clubs face a recurring challenge: reminding members to renew
      while making each message feel personal rather than generic. A mass-blast "Dear Member" email gets ignored.
      A message that says "Dear Dr. Adaeze, your ICAN membership expires on 31 December 2024" gets opened.
    </p>
    <p class="text-neutral-700 leading-relaxed mb-4">
      MergeMail makes the latter just as easy as the former. Export your membership database with columns like
      <code class="bg-neutral-100 border rounded px-1 text-sm">member_name</code>,
      <code class="bg-neutral-100 border rounded px-1 text-sm">membership_id</code>,
      <code class="bg-neutral-100 border rounded px-1 text-sm">expiry_date</code>, and
      <code class="bg-neutral-100 border rounded px-1 text-sm">renewal_link</code>.
      Write a single email template that uses all four, map the columns, and send. Every member gets a message that addresses them by name and references their specific membership data.
    </p>
    <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
      <h3 class="text-sm font-semibold text-blue-900 mb-2">Tip: attach personalized invoices</h3>
      <p class="text-sm text-blue-800">
        Combine email merge with the document generation feature. Upload a dues invoice template (DOCX or PDF)
        and MergeMail attaches each member's individually generated invoice to their renewal reminder.
      </p>
    </div>
    <p class="text-sm text-neutral-500">
      <strong>Typical use:</strong> Monthly or quarterly renewal cycles; targeted reminders for members expiring in the next 30 days.
    </p>
  </article>

  <!-- Event Invitations -->
  <article class="mb-16 p-8 rounded-2xl border border-neutral-200 bg-white shadow-sm">
    <div class="flex items-center gap-4 mb-6">
      <div class="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
        <span class="material-symbols-outlined text-purple-600" style="font-size:2rem">event</span>
      </div>
      <div>
        <h2 class="text-2xl font-bold text-neutral-900">Event Invitations</h2>
        <p class="text-sm text-neutral-500 mt-1">Conferences, webinars, award ceremonies, training programs</p>
      </div>
    </div>
    <p class="text-neutral-700 leading-relaxed mb-4">
      Events are won or lost at the invitation stage. A personalized invitation — one that mentions the recipient's name,
      their nominated session or table number, and includes a unique access link — converts far better than a generic blast.
    </p>
    <p class="text-neutral-700 leading-relaxed mb-4">
      Organizers using MergeMail include unique access codes, QR codes, Zoom links, or Eventbrite confirmation numbers
      in each invitation by adding those values as columns in the spreadsheet. The email template references
      <code class="bg-neutral-100 border rounded px-1 text-sm">{'{{access_code}}'}</code> or
      <code class="bg-neutral-100 border rounded px-1 text-sm">{'{{meeting_link}}'}</code>, and every invitee gets their own.
    </p>
    <p class="text-neutral-700 leading-relaxed mb-4">
      For physical events, the document generation feature produces personalized e-tickets or name badges as PDFs.
      Print-ready PDFs with the attendee's name, session track, and seat number can be attached to the invitation email in one run.
    </p>
    <div class="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4">
      <h3 class="text-sm font-semibold text-purple-900 mb-2">Example columns for an event spreadsheet</h3>
      <div class="font-mono text-xs text-purple-800 bg-white border border-purple-100 rounded p-3">
        full_name | email | ticket_type | seat_number | access_link | dietary_pref
      </div>
    </div>
    <p class="text-sm text-neutral-500">
      <strong>Supported event types:</strong> in-person, virtual (Zoom/Teams/Google Meet), and hybrid.
    </p>
  </article>

  <!-- Application Status Updates -->
  <article class="mb-16 p-8 rounded-2xl border border-neutral-200 bg-white shadow-sm">
    <div class="flex items-center gap-4 mb-6">
      <div class="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
        <span class="material-symbols-outlined text-green-600" style="font-size:2rem">task_alt</span>
      </div>
      <div>
        <h2 class="text-2xl font-bold text-neutral-900">Application Status Updates</h2>
        <p class="text-sm text-neutral-500 mt-1">HR departments, university admissions, scholarship programs, grant awarding bodies</p>
      </div>
    </div>
    <p class="text-neutral-700 leading-relaxed mb-4">
      Sending application decisions is a high-stakes communication. Whether it's a job offer, university admission, scholarship award,
      or grant decision, every applicant deserves a clear, personalized response — not a template that accidentally includes someone else's name.
    </p>
    <p class="text-neutral-700 leading-relaxed mb-4">
      HR teams use MergeMail to send offer letters (as DOCX attachments with the candidate's name, role, salary, and start date filled in),
      rejection notices (personalized with the position applied for), and interview invitations with specific date/time slots.
    </p>
    <p class="text-neutral-700 leading-relaxed mb-4">
      Admissions offices use it to send acceptance letters as PDFs with the student's name, programme, matriculation number,
      and registration instructions — all from their university's official email domain via their own SMTP.
    </p>
    <div class="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
      <h3 class="text-sm font-semibold text-green-900 mb-2">Segment your list first</h3>
      <p class="text-sm text-green-800">
        Create separate datasets for accepted, waitlisted, and rejected applicants. Run a different campaign for each,
        each using the appropriate email template and letter template. Credits are deducted only for emails that are sent.
      </p>
    </div>
    <p class="text-sm text-neutral-500">
      <strong>Compliance note:</strong> All data is stored with Row Level Security. Only your account can access your applicant list.
      See our <a href="/privacy" class="text-brand-600 no-underline hover:underline">Privacy Policy</a> for details on data handling.
    </p>
  </article>

  <div class="text-center">
    <a href="/login" class="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors no-underline shadow">
      <span class="material-symbols-outlined">rocket_launch</span>
      Start your first campaign free
    </a>
  </div>
</div>
