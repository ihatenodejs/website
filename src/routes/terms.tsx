import { Link, createFileRoute } from '@tanstack/react-router'
import { Breadcrumbs } from '~/components/Breadcrumbs'
import { Panel } from '~/components/Panel'

export const Route = createFileRoute('/terms')({
  ssr: true,
  head: () => ({
    meta: [
      { title: 'Terms of service | p0ntus' },
      {
        name: 'description',
        content:
          'The rules for using p0ntus, including accounts, comments, moderation, and liability.',
      },
    ],
  }),
  component: TermsRoute,
})

function TermsRoute() {
  return (
    <>
      <Breadcrumbs current="Terms" />
      <div className="canvas page page-narrow">
        <h1>Terms of service</h1>
        <p className="page-intro">
          Last updated 17 November 2026. These terms are an agreement between
          you and Aidan Honor about your use of p0ntus, a personal profile site
          and member directory. By using the site, creating an account, or
          posting a comment, you agree to these terms. If you do not agree, do
          not use the site.
        </p>

        <Panel title="1. The service">
          <p>
            p0ntus lets people create a public profile, browse member profiles,
            and leave comments that are reviewed before they appear. It is a
            personal project run by one person, not a company, and it is free to
            use. The site is not a public utility, a marketplace, or an
            emergency service.
          </p>
          <p>
            Features may be added, changed, or removed at any time. The site may
            be unavailable while I work on it or fix a problem.
          </p>
        </Panel>

        <Panel title="2. Who may use it">
          <p>
            You must be at least 13. If the law where you live requires a higher
            age or parental permission for a service like this, you must meet
            that requirement. You must be able to enter into a binding agreement
            and must not be barred from using the site under applicable law.
          </p>
          <p>
            Use accurate information. Do not impersonate another person or
            create an account to get around a suspension or deletion.
          </p>
        </Panel>

        <Panel title="3. Your account">
          <p>
            You are responsible for your account and for keeping your password
            private. Do not share it. Tell me promptly if you believe someone
            else has access. I am not responsible for losses caused by someone
            using your account with your password.
          </p>
          <p>
            Sign-in uses your email address. The site does not offer automatic
            password recovery, so keep your password somewhere safe. If you lose
            access, you may not be able to recover the account.
          </p>
          <p>
            You can change your username and profile details from your account
            page. Usernames are unique. The home profile is protected and cannot
            be renamed or deleted.
          </p>
        </Panel>

        <Panel title="4. Your content">
          <p>
            You keep ownership of the profile text, comments, and other content
            you post. You give me permission to store, display, and moderate
            that content as needed to run the site, including showing it on
            public pages and to administrators. This permission ends when you
            delete the content, except for copies others have already made or
            shared.
          </p>
          <p>
            Do not post content you do not have the right to share. You are
            responsible for what you post.
          </p>
          <p>
            Profiles and approved comments are public. Do not post private
            information about yourself or anyone else.
          </p>
          <p>
            Comments are short, plain text, and are reviewed before publication.
            Approval is not guaranteed. Comments reflect the person who wrote
            them, not me, and I do not endorse them.
          </p>
        </Panel>

        <Panel title="5. Acceptable use">
          <p>Do not use the site to:</p>
          <ul>
            <li>break the law or help someone else break it;</li>
            <li>threaten, harass, or intimidate anyone;</li>
            <li>
              post hateful content or content that targets people for who they
              are;
            </li>
            <li>post spam or repeated unwanted messages;</li>
            <li>impersonate anyone;</li>
            <li>
              publish another person's private information without permission;
            </li>
            <li>post sexual content involving minors;</li>
            <li>upload or link to malware;</li>
            <li>
              try to access another person's account or the site's systems
              without permission;
            </li>
            <li>probe, scan, or overload the site;</li>
            <li>evade moderation or a suspension.</li>
          </ul>
          <p>
            This list is not exhaustive. If a use would reasonably harm the site
            or its members, do not do it.
          </p>
        </Panel>

        <Panel title="6. Moderation and removal">
          <p>
            I review comments before they appear. I may reject, remove, or
            delete any comment, and I may suspend or delete any account, if I
            believe it breaks these terms, harms another person, or puts the site
            at risk. I may also remove content in response to a legal request.
          </p>
          <p>
            I do not monitor every profile or comment, and I do not guarantee
            that content you see is accurate or appropriate. Approval of one
            comment does not mean I approve of others.
          </p>
          <p>
            If you see content that breaks these terms, email{' '}
            <a href="mailto:aidan@p0ntus.com">aidan@p0ntus.com</a> with a link
            to the profile or comment.
          </p>
        </Panel>

        <Panel title="7. My content">
          <p>
            The site's design, text, and code are owned by Aidan Honor or used
            with permission. You may read the site, share links to it, and use
            content you own. You may not copy, republish, or sell the site or its
            content except as the law allows or with written permission.
          </p>
          <p>Your own content remains yours, as described above.</p>
        </Panel>

        <Panel title="8. Availability and changes">
          <p>
            The site is provided as is and as available. I do not promise that
            it will be online, error-free, or that content will be preserved. Do
            not use it as the only copy of anything important.
          </p>
          <p>
            I may change, suspend, or discontinue any part of the site at any
            time. I may update these terms. If a change is material, I will post
            a notice on the site. Continued use after a change means you accept
            the new terms. If you do not agree, stop using the site and delete
            your account.
          </p>
        </Panel>

        <Panel title="9. Ending use">
          <p>
            You can delete your account from your{' '}
            <Link to="/account">account page</Link>. Deletion is permanent. It
            removes your profile, sessions, comments you wrote or received, and
            any avatar you uploaded. The home profile cannot be deleted.
          </p>
          <p>
            I may suspend or delete your account if you break these terms, if
            the law requires it, or if keeping the account would harm the site
            or another person. I will try to explain the reason where it is
            practical to do so.
          </p>
          <p>
            If your account is deleted, do not create another one to get around
            the deletion. The sections of these terms that by their nature
            should survive, including the disclaimers and limitation of
            liability, continue to apply.
          </p>
        </Panel>

        <Panel title="10. Disclaimers">
          <p>
            To the extent the law allows, the site is provided without
            warranties of any kind, whether express or implied, including
            warranties of merchantability, fitness for a particular purpose,
            accuracy, and non-infringement. I do not warrant that the site will
            be uninterrupted, secure, or free of errors.
          </p>
          <p>
            Profiles and comments are written by members. I do not verify them
            and do not guarantee that they are accurate, complete, or lawful.
          </p>
          <p>
            Nothing in these terms excludes a warranty or right that cannot be
            excluded under the law where you live.
          </p>
        </Panel>

        <Panel title="11. Limitation of liability">
          <p>
            To the extent the law allows, I am not liable for indirect,
            incidental, special, consequential, or punitive damages, or for lost
            data, profits, or goodwill, arising from your use of the site or
            your inability to use it.
          </p>
          <p>
            My total liability for all claims relating to the site is limited to
            the amount you paid me to use it, if any. The site is free, so that
            amount is normally zero.
          </p>
          <p>
            Nothing in these terms limits liability for fraud, willful
            misconduct, death or personal injury caused by negligence, or any
            other liability that cannot be limited by law.
          </p>
        </Panel>

        <Panel title="12. Indemnity">
          <p>
            To the extent the law allows, you agree to indemnify and hold Aidan
            Honor harmless from claims, losses, and reasonable costs, including
            legal fees, that arise from your content or your breach of these
            terms. This does not apply to the extent a claim is caused by Aidan
            Honor's own negligence or breach of these terms.
          </p>
        </Panel>

        <Panel title="13. Governing law and disputes">
          <p>
            These terms are governed by the laws of the jurisdiction where Aidan
            Honor lives, without regard to conflict-of-law rules. If a dispute
            arises, email me first so we can try to resolve it. If we cannot
            resolve it, the courts of that jurisdiction will handle it, unless
            the law where you live gives you the right to use your local courts.
          </p>
          <p>
            Nothing in these terms removes mandatory consumer protections or
            other rights you have under the law where you live.
          </p>
        </Panel>

        <Panel title="14. General">
          <p>
            If any part of these terms is found unenforceable, the rest remains
            in effect. A failure to enforce a term is not a waiver of it. These
            terms and the privacy policy are the entire agreement about the
            site.
          </p>
          <p>
            If the site changes hands, the new operator takes over these terms
            and the privacy policy.
          </p>
        </Panel>

        <Panel title="15. Contact">
          <p>
            Questions about these terms can go to{' '}
            <a href="mailto:aidan@p0ntus.com">aidan@p0ntus.com</a>. The way the
            site handles personal information is described in the{' '}
            <Link to="/privacy">privacy policy</Link>.
          </p>
        </Panel>
      </div>
    </>
  )
}
