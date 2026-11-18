import { Link, createFileRoute } from '@tanstack/react-router'
import { Breadcrumbs } from '~/components/Breadcrumbs'
import { Panel } from '~/components/Panel'

export const Route = createFileRoute('/privacy')({
  ssr: true,
  head: () => ({
    meta: [
      { title: 'Privacy policy | p0ntus' },
      {
        name: 'description',
        content:
          'How p0ntus handles personal information, accounts, profiles, and comments.',
      },
    ],
  }),
  component: PrivacyRoute,
})

function PrivacyRoute() {
  return (
    <>
      <Breadcrumbs current="Privacy" />
      <div className="canvas page page-narrow">
        <h1>Privacy policy</h1>
        <p className="page-intro">
          Last updated 17 November 2026. p0ntus is a personal profile site and
          member directory run by Aidan Honor. This policy explains what
          personal information the site collects, why it is collected, who can
          see it, and the choices you have.
        </p>

        <Panel title="1. Who is responsible">
          <p>
            p0ntus is a personal project, not a company. For the purposes of
            data protection law, Aidan Honor is the data controller for the
            information described in this policy.
          </p>
          <p>
            For any privacy question or request, email{' '}
            <a href="mailto:aidan@p0ntus.com">aidan@p0ntus.com</a>.
          </p>
        </Panel>

        <Panel title="2. What I collect">
          <p>
            <strong>Account information.</strong> When you create an account, I
            collect your email address, password, display name, and username. I
            also collect the profile details you choose to add: a biography, an
            avatar, and a profile theme. The account record includes when it was
            created and when it was last changed. Your password is stored in a
            protected form and cannot be read by me.
          </p>
          <p>
            <strong>Comments.</strong> When you post a comment, I collect the
            text, the profile it belongs to, the time it was posted, and whether
            it is waiting for review or has been approved.
          </p>
          <p>
            <strong>Sign-in and security information.</strong> When you sign in,
            the site creates a session record. That record includes your IP
            address, browser type, when the session started, and when it
            expires. I use it to keep you signed in and to investigate abuse.
          </p>
          <p>
            <strong>Verification information.</strong> Account creation uses
            Cloudflare Turnstile to check that the request comes from a person.
            Cloudflare receives information about your browser and network as
            part of that check.
          </p>
          <p>
            <strong>What I do not collect.</strong> The site has no analytics,
            advertising, or third-party tracking scripts. It does not ask for
            your phone number, postal address, or payment details, and it does
            not send marketing email.
          </p>
        </Panel>

        <Panel title="3. What is public">
          <p>
            Your display name, username, biography, avatar, profile theme, join
            date, and approved comments can be seen by anyone who visits the
            site. Your email address is not shown on your profile. Comments
            waiting for review are visible to you and to administrators.
          </p>
          <p>
            Public information can be copied and shared by others. Do not put
            private or sensitive details in your profile or comments.
          </p>
          <p>
            If you use an image hosted on another site as your avatar, visitors'
            browsers load it from that host. The host can see visitors' IP
            addresses and browser information. Avatars uploaded to this site are
            served by this site.
          </p>
        </Panel>

        <Panel title="4. Why I use it">
          <p>I use personal information to:</p>
          <ul>
            <li>create and run your account;</li>
            <li>show your profile and approved comments;</li>
            <li>review comments before they are published;</li>
            <li>keep the site secure, prevent abuse, and fix problems;</li>
            <li>answer your messages and privacy requests;</li>
            <li>comply with the law and respond to lawful requests.</li>
          </ul>
          <p>
            Where data protection law requires a legal basis, I rely on
            performing the agreement with you (running your account and the
            site), my legitimate interests (keeping the site secure, moderating
            content, and improving it), your consent where I ask for it, and
            legal obligations.
          </p>
        </Panel>

        <Panel title="5. Who I share with">
          <p>
            I do not sell personal information, use it for advertising, or give
            it to data brokers.
          </p>
          <p>I share information only in these cases:</p>
          <ul>
            <li>
              Cloudflare, for Turnstile bot checks, under the{' '}
              <a
                href="https://www.cloudflare.com/privacypolicy/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Cloudflare privacy policy
              </a>
              ;
            </li>
            <li>
              the hosting provider that runs the site and stores its data, which
              processes the information on my instructions;
            </li>
            <li>
              public pages, when you or I publish profile content or approved
              comments;
            </li>
            <li>
              legal requests, when required by law or necessary to protect
              rights, safety, or the site.
            </li>
          </ul>
          <p>
            Cloudflare and the hosting provider may process information outside
            the country where you live. Their own privacy policies describe the
            safeguards they use.
          </p>
          <p>
            Links to other websites are not covered by this policy. Read the
            privacy policy of any site you visit.
          </p>
        </Panel>

        <Panel title="6. Cookies">
          <p>
            The site uses an essential session cookie to keep you signed in. It
            lasts until your session expires or you log out, and it is not used
            for advertising or tracking.
          </p>
          <p>
            Cloudflare Turnstile may set its own cookies or similar storage when
            you create an account. Cloudflare controls those, and its privacy
            policy applies.
          </p>
          <p>
            Because the site uses no analytics or advertising cookies, there is
            no cookie banner. If you block cookies in your browser, you will not
            be able to sign in.
          </p>
        </Panel>

        <Panel title="7. How long I keep it">
          <p>
            Account and profile information is kept while your account exists.
            Comments stay until you delete them, they are removed, or your
            account is deleted. Session records are removed when you log out or
            when the session expires.
          </p>
          <p>
            If you delete your account, the site deletes your account, profile,
            sessions, comments you wrote, comments on your profile, and uploaded
            avatar. This happens in one action and cannot be undone. I do not
            keep a separate archive of deleted accounts. Routine backups, if
            any, may retain copies until they are replaced. I may keep limited
            information if the law requires it or to resolve a dispute.
          </p>
          <p>
            The home profile is part of the site and cannot be deleted through
            the account page.
          </p>
        </Panel>

        <Panel title="8. Security">
          <p>
            I take reasonable steps to protect the information the site holds,
            including limiting access to the operator and protecting passwords.
            No website can promise complete security. Use a unique password, and
            tell me if you think your account has been compromised.
          </p>
        </Panel>

        <Panel title="9. Your choices and rights">
          <p>
            You can view and change your profile from your{' '}
            <Link to="/account">account page</Link>. You can delete your
            comments there. You can also delete your account there, which
            removes the information described above.
          </p>
          <p>
            Depending on where you live, you may have the right to ask for a
            copy of your information, correct it, delete it, restrict or object
            to its use, or receive it in a portable format. You may withdraw
            consent where consent is the basis for processing. Some rights have
            limits under the law.
          </p>
          <p>
            To make a request, email{' '}
            <a href="mailto:aidan@p0ntus.com">aidan@p0ntus.com</a>. I may ask
            for proof that the account is yours. I will answer within the time
            the law requires. You can also complain to the data protection
            authority where you live.
          </p>
        </Panel>

        <Panel title="10. Children">
          <p>
            The site is not intended for children under 13. Do not create an
            account if you are under 13. If the law where you live sets a higher
            minimum age for using a service like this, you must meet that age or
            have permission from a parent or guardian.
          </p>
          <p>
            If I learn that a child below the minimum age has created an
            account, I will delete it. A parent or guardian can contact{' '}
            <a href="mailto:aidan@p0ntus.com">aidan@p0ntus.com</a> to request
            this.
          </p>
        </Panel>

        <Panel title="11. Changes">
          <p>
            I may update this policy when the site or the law changes. The date
            at the top shows the current version. If a change materially affects
            how I use your information, I will announce it on the site or
            contact you by email before it takes effect, where that is
            practical.
          </p>
          <p>
            If the site changes hands, your information may transfer to the new
            operator, who must follow this policy unless you agree to a new one.
          </p>
        </Panel>

        <Panel title="12. Contact">
          <p>
            Questions about this policy can go to{' '}
            <a href="mailto:aidan@p0ntus.com">aidan@p0ntus.com</a>. The rules
            for using the site are in the{' '}
            <Link to="/terms">terms of service</Link>.
          </p>
        </Panel>
      </div>
    </>
  )
}
