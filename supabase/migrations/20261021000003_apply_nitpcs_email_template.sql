-- ============================================================================
-- 20261021000003_apply_nitpcs_email_template.sql
-- ----------------------------------------------------------------------------
-- Applies the new NITPCS induction certificate email template:
--   1. Updates campaign bdce0836-b3cf-447b-b6fa-3b779eff8d0e's config_snapshot
--      with the corrected subject_template + body_html (preserving all other
--      keys such as recipient_email_column, file_match_config, etc.).
--   2. Creates a reusable email_templates row ("NITPCS Induction Certificate")
--      owned by that campaign's user, so the template is selectable in the UI
--      for the next campaign send.
--   3. Links the campaign.email_template_id to the reusable template.
--
-- Storage model (verified in src/routes/api/internal/dispatch/+server.ts):
--   The dispatcher reads config_snapshot->>'subject_template' and
--   config_snapshot->>'body_html' from the campaigns table. There is no
--   in-code default template. Merge variables come from each recipient's
--   row_data: {{full_name}}, {{mem_no}}, {{s_no}}, {{email}}.
--
-- NOTE: Running this SQL does NOT send any emails. It only updates the stored
-- template. No delivery jobs are created or re-queued.
--
-- Before sending, replace the bracketed footer placeholders
-- ([contact email], [website], [phone]) with NITPCS official details.
-- ============================================================================

BEGIN;

DO $proc$
DECLARE
  v_campaign_id uuid := 'bdce0836-b3cf-447b-b6fa-3b779eff8d0e';
  v_subject text := $subject$Congratulations on Your NITPCS Induction — Certificate Attached$subject$;
  v_body_html text := $body$
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>NITPCS Induction Certificate</title>
</head>
<body style="margin:0;padding:0;background-color:#eaeff3;font-family:'Segoe UI',Arial,Helvetica,sans-serif;color:#243447;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eaeff3;">
    <tr>
      <td align="center" style="padding:28px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 3px 14px rgba(13,59,92,0.14);">
          <tr>
            <td style="background-color:#0d3b5c;padding:30px 28px;text-align:center;">
              <div style="font-size:30px;font-weight:700;letter-spacing:3px;color:#ffffff;line-height:1.1;">NITPCS</div>
              <div style="font-size:12px;letter-spacing:1px;color:#cfe0ee;margin-top:8px;text-transform:uppercase;">Nigeria IT Professionals in Civil &amp; Public Service</div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#15633e;height:5px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:34px 28px 8px 28px;">
              <div style="font-size:11px;letter-spacing:2px;color:#15633e;font-weight:700;text-transform:uppercase;">Induction Confirmation</div>
              <h1 style="margin:10px 0 20px 0;font-size:22px;line-height:1.3;color:#0d3b5c;font-weight:700;">Congratulations on Your Induction</h1>
              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.65;color:#33475b;">Dear <strong style="color:#0d3b5c;">{{full_name}}</strong>,</p>
              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.65;color:#33475b;">It is with great pleasure that we formally announce your successful induction as a member of the <strong>Nigeria IT Professionals in Civil &amp; Public Service (NITPCS)</strong>. Following the review of your credentials and the completion of the induction process, you are now welcomed into a distinguished community of IT professionals serving across the Nigerian civil and public service.</p>
              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.65;color:#33475b;">Your induction signifies a commitment to excellence, integrity, and the advancement of professional standards in information technology within the public sector. We look forward to your valuable contributions to the growth of the profession and to NITPCS.</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;background-color:#f1f7f3;border-left:4px solid #15633e;border-radius:6px;">
                <tr>
                  <td style="padding:16px 18px;">
                    <div style="font-size:14px;font-weight:700;color:#15633e;margin-bottom:4px;">Your Induction Certificate is Attached</div>
                    <div style="font-size:13px;line-height:1.55;color:#3a4f42;">A personalized certificate (JPG image) has been attached to this email. Please download and save it for your records. We kindly ask that you confirm receipt at your earliest convenience.</div>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;border-top:1px solid #e3e8ee;border-bottom:1px solid #e3e8ee;">
                <tr>
                  <td style="padding:13px 0;font-size:14px;color:#6b7a8a;width:55%;border-bottom:1px solid #eef2f6;">Membership Number</td>
                  <td style="padding:13px 0;font-size:14px;color:#0d3b5c;font-weight:700;text-align:right;white-space:nowrap;border-bottom:1px solid #eef2f6;">{{mem_no}}</td>
                </tr>
                <tr>
                  <td style="padding:13px 0;font-size:14px;color:#6b7a8a;width:55%;">Serial Number</td>
                  <td style="padding:13px 0;font-size:14px;color:#0d3b5c;font-weight:700;text-align:right;white-space:nowrap;">{{s_no}}</td>
                </tr>
              </table>
              <p style="margin:0 0 6px 0;font-size:15px;line-height:1.65;color:#33475b;">Once again, congratulations on this well-deserved milestone. We are proud to count you among our inductees and look forward to walking this professional journey with you.</p>
              <p style="margin:18px 0 0 0;font-size:15px;line-height:1.65;color:#33475b;">Warm regards,</p>
              <p style="margin:4px 0 0 0;font-size:15px;line-height:1.55;color:#0d3b5c;font-weight:700;">The Induction Committee</p>
              <p style="margin:2px 0 0 0;font-size:13px;line-height:1.55;color:#6b7a8a;">Nigeria IT Professionals in Civil &amp; Public Service</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#0d3b5c;padding:24px 28px;">
              <div style="font-size:13px;font-weight:700;color:#ffffff;letter-spacing:1px;">NITPCS</div>
              <div style="font-size:11px;color:#cfe0ee;margin-top:4px;line-height:1.5;">Nigeria IT Professionals in Civil &amp; Public Service</div>
              <div style="height:1px;background-color:#1c4f78;margin:12px 0;font-size:0;line-height:0;">&nbsp;</div>
              <div style="font-size:11px;color:#a9c2d8;line-height:1.7;">
                Email: [contact email] &nbsp;•&nbsp; Web: [website] &nbsp;•&nbsp; Tel: [phone]
              </div>
              <div style="font-size:10px;color:#7fa3c0;margin-top:12px;line-height:1.5;">This message was sent to {{email}} in connection with your NITPCS induction. Please do not reply directly to this automated message.</div>
            </td>
          </tr>
        </table>
        <div style="max-width:600px;width:100%;text-align:center;font-size:11px;color:#8a99a8;margin-top:14px;">&copy; NITPCS. All rights reserved.</div>
      </td>
    </tr>
  </table>
</body>
</html>
$body$;
  v_user_id uuid;
  v_workspace_id uuid;
  v_tpl_id uuid;
BEGIN
  -- Fetch the campaign's owner + workspace
  SELECT c.user_id, c.workspace_id
    INTO v_user_id, v_workspace_id
  FROM campaigns c
  WHERE c.id = v_campaign_id;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'Campaign % not found; nothing updated.', v_campaign_id;
  ELSE
    -- 1. Update the target campaign's config_snapshot (subject + body),
    --    preserving all other keys via jsonb_set.
    UPDATE campaigns
    SET config_snapshot = jsonb_set(
          jsonb_set(
            COALESCE(config_snapshot, '{}'::jsonb),
            '{subject_template}', to_jsonb(v_subject)
          ),
          '{body_html}', to_jsonb(v_body_html)
        ),
        updated_at = now()
    WHERE id = v_campaign_id;

    -- 2. Create a reusable email_templates row (idempotent by name + owner)
    INSERT INTO email_templates (user_id, workspace_id, name, subject, body_html, variables)
    SELECT v_user_id, v_workspace_id, 'NITPCS Induction Certificate', v_subject, v_body_html,
           ARRAY['full_name','mem_no','s_no','email']
    WHERE NOT EXISTS (
      SELECT 1 FROM email_templates et
      WHERE et.name = 'NITPCS Induction Certificate' AND et.user_id = v_user_id
    );

    -- 3. Link the campaign to the reusable template (only if not already linked)
    SELECT id INTO v_tpl_id
    FROM email_templates
    WHERE name = 'NITPCS Induction Certificate' AND user_id = v_user_id
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_tpl_id IS NOT NULL THEN
      UPDATE campaigns
      SET email_template_id = v_tpl_id, updated_at = now()
      WHERE id = v_campaign_id AND email_template_id IS NULL;
    END IF;

    RAISE NOTICE 'Applied NITPCS induction template to campaign %.', v_campaign_id;
  END IF;
END
$proc$;

COMMIT;

-- ============================================================================
-- VERIFY (run after the DO block to confirm the values landed)
-- ============================================================================
SELECT
  id,
  name,
  status,
  email_template_id,
  config_snapshot->>'subject_template' AS subject_template,
  left(config_snapshot->>'body_html', 120) AS body_html_preview
FROM campaigns
WHERE id = 'bdce0836-b3cf-447b-b6fa-3b779eff8d0e';

SELECT id, name, subject, variables
FROM email_templates
WHERE name = 'NITPCS Induction Certificate'
ORDER BY created_at DESC;
