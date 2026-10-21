"""Build a local preview of an email template, as Brevo would send it.

The real templates load their images from https://hackthetoon.com and use
Brevo's template language ({{ params.name }}, {% if %}), so opened directly
they show broken images and raw tags. This writes <template>.preview.html
next to the template, with the images pointed at the local copies in
assets/email and sample values filled in, ready to open in a browser.

    python3 email/preview.py                      # interest-received.html, as "Dan Banfield"
    python3 email/preview.py --name "Alex Smith"  # a different sample name
    python3 email/preview.py --name ""            # no name: the plain greeting
"""
import argparse
import pathlib
import re

here = pathlib.Path(__file__).resolve().parent

parser = argparse.ArgumentParser()
parser.add_argument("template", nargs="?", default="interest-received.html")
parser.add_argument("--name", default="Dan Banfield")
parser.add_argument("--email", default="dan@example.com")
args = parser.parse_args()

values = {
    "params.name": args.name,
    "params.first_name": args.name.split()[0] if args.name.strip() else "",
    "params.email": args.email,
    "contact.FIRSTNAME": "",
}

source = here / args.template
html = source.read_text(encoding="utf-8")
html = html.replace("https://hackthetoon.com/assets/email/", "../assets/email/")

# Enough of Brevo's template language for these templates: {% if x %}…{% else %}…{% endif %}
# (innermost first, so nested ifs work) and {{ x }}.
inner_if = re.compile(r"\{%\s*if\s+([\w.]+)\s*%\}((?:(?!\{%\s*if).)*?)\{%\s*endif\s*%\}", re.S)
def resolve_if(match):
    then, _, otherwise = match.group(2).partition("{% else %}")
    return then if values.get(match.group(1)) else otherwise
while inner_if.search(html):
    html = inner_if.sub(resolve_if, html)
html = re.sub(r"\{\{\s*([\w.]+)\s*\}\}", lambda m: values.get(m.group(1), ""), html)

if "{%" in html or "{{" in html:
    raise SystemExit("preview: some template tags weren't understood")

out = source.with_suffix(".preview.html")
out.write_text(html, encoding="utf-8")
print(f"Open {out}")
