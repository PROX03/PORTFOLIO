# Md Prottoy Bhuyian — portfolio website

A one-page portfolio built with plain HTML, CSS and JavaScript. There is no build step.
All text and images live in `/content` and `/assets/uploads`, and you edit them from a
browser at `/admin`. You never need to touch the code.

## What is in this folder

| Path | What it is |
| --- | --- |
| `index.html` | The page. The hero (name, headline, summary) is written here so it shows instantly. |
| `content/*.json` | Every piece of text on the site. The admin panel edits these files. |
| `assets/css/style.css` | The design: colours, fonts and spacing are variables at the top. |
| `assets/js/main.js` | Reads `/content` and builds the page; modals, lightbox, form. |
| `assets/img`, `assets/files` | Headshot, share image, icons; CV and ExcelMania downloads. |
| `assets/uploads` | Everything you upload from the admin panel lands here. |
| `admin/` | The admin panel (Decap CMS) and its settings (`config.yml`). |
| `netlify.toml`, `robots.txt`, `sitemap.xml`, `404.html` | Hosting settings, search-engine files, error page. |

## Step 1: Put the code on GitHub

1. The code is already in your GitHub repository. Make sure the finished site is on the **`main`** branch
   (merge the working branch into `main` on github.com: **Pull requests → New pull request → Merge**).

## Step 2: Deploy on Netlify

1. Go to <https://app.netlify.com> and sign up with your GitHub account.
2. Click **Add new site → Import an existing project → GitHub** and choose this repository.
3. Leave **Build command** empty. Set **Publish directory** to `.` (a single dot). Branch: `main`.
4. Click **Deploy**. After about a minute you get an address like `random-name-123.netlify.app`.
5. Rename it: **Site configuration → Change site name** and type `prottoy-bhuyian`.
   Your site is now `https://prottoy-bhuyian.netlify.app`.

> If that name is taken and you pick another one, replace `prottoy-bhuyian.netlify.app` with your
> real address in these five files: `index.html`, `robots.txt`, `sitemap.xml`, `admin/config.yml`
> and `content/site.json`. (On github.com open each file, click the pencil, edit, commit.)

## Step 3: Switch on the login (Identity and Git Gateway)

1. In Netlify open your site, then **Site configuration → Identity → Enable Identity**.
2. Under **Registration preferences** choose **Invite only**. Nobody else can sign up.
3. Scroll to **Services → Git Gateway** and click **Enable Git Gateway**.
   This lets the admin panel save your edits to GitHub.

> Netlify now labels Identity as a legacy feature. It still works. If you cannot find it in your
> dashboard, tell me and the login can be switched to another free service (for example DecapBridge)
> by changing a few lines in `admin/config.yml`.

## Step 4: Invite yourself

1. Still in **Identity**, click **Invite users** and enter your own email address.
2. Open the email, click **Accept the invite**. It opens your site and moves you to `/admin`.
3. Choose a password. You are the only user.

## Step 5: Log in at /admin

1. Go to `https://prottoy-bhuyian.netlify.app/admin/`.
2. Click **Login with Netlify Identity** and enter your email and password.
3. On the left you see five groups: Hero and site settings, About, Roles/case studies/projects,
   Certificates and photos, Contact.

How editing works: open a file, change something, click **Publish**. Netlify rebuilds the site
in about a minute, then refresh the page to see the change.

- **Hide an item** without deleting it: switch off **Visible on site**.
- **Reorder** items: drag them by the handle on the left of each list row.
- **Bold text**: wrap words in two asterisks, like `**TEDx SUST**`.
- **Replace your headshot or CV**: *Hero and site settings → Profile*, upload the new file, Publish.
- **Add a screenshot or file to a case study**: *Case studies* → open the case → *Screenshots* or *Downloads*.
- Change the **Last updated** date in *Site settings* whenever you edit the site.

## Step 6: Add a certificate

1. In `/admin` open **Certificates and photos → Certificates**.
2. Click **Add certificates**.
3. Click **Choose an image**, upload a JPG or PNG (keep it under 500 KB), and select it.
4. Fill in **Title**, **Issuer**, **Year** and, if you have one, a verification **Link**.
5. Click **Publish**. Wait about a minute and refresh your site.
   The Certificates section and its menu link appear automatically once there is one item.

Event photos work the same way under **Event photos**.

## Step 7: Check a contact-form submission

1. Open your live site, fill in the contact form and send a test message.
   You should see "Thank you. Your message has been sent…".
2. In Netlify open **Forms**. You will see a form called **contact**; click it to read messages.
   (If the Forms page asks you to **Enable form detection**, do that and then redeploy once:
   **Deploys → Trigger deploy → Deploy site**.)
3. To get an email for each message: **Forms → Form notifications → Add notification → Email notification**.

## Placeholders to review

- **Site address**: `prottoy-bhuyian.netlify.app` is assumed (see Step 2).
- **ExcelMania dashboard screenshot**: add it in the case study's *Screenshots* list.
- **IPESPHERE "What I learned"**: three draft points for you to refine.
- **"How I work with AI" lines** (Skills): drafted from your brief; reword them in your own voice.
- **Role dates**: every role has an empty *Period* field you can fill in.
- **Certificates and Event photos**: empty, so both sections are hidden until you add items.

## Good to know

- Photos you upload are not compressed automatically. Resize large images before uploading
  (about 1600 px wide is plenty) so the site stays fast.
- To preview the site on your own computer, run `python3 -m http.server` in this folder and
  open <http://localhost:8000>. The admin login only works on the live Netlify site.
- Colours and fonts: edit the variables at the top of `assets/css/style.css`.
