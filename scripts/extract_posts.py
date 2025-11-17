#!/usr/bin/env python3
import re

def extract_tuples(sql_text):
    tuples = []
    for m in re.finditer(r"INSERT INTO `wp_posts`.*?VALUES", sql_text, flags=re.S):
        start = m.end()
        # find the terminating semicolon for this INSERT
        semi = sql_text.find(';', start)
        block = sql_text[start:semi]
        i = 0
        n = len(block)
        while i < n:
            # skip whitespace and commas
            while i < n and block[i] in "\n\r \t,":
                i += 1
            if i >= n:
                break
            if block[i] != '(':
                break
            depth = 0
            j = i
            while j < n:
                if block[j] == '(':
                    depth += 1
                elif block[j] == ')':
                    depth -= 1
                    if depth == 0:
                        # include closing parenthesis
                        tuples.append(block[i+1:j])
                        i = j+1
                        break
                j += 1
            else:
                break
    return tuples

# parse a single tuple content (without outer parentheses) into fields
def parse_tuple_content(s):
    fields = []
    i = 0
    n = len(s)
    cur = ''
    in_quote = False
    while i < n:
        ch = s[i]
        if in_quote:
            if ch == "'":
                # check for escaped quote by two single quotes or backslash
                if i+1 < n and s[i+1] == "'":
                    cur += "'"
                    i += 2
                    continue
                else:
                    in_quote = False
                    i += 1
                    continue
            elif ch == '\\':
                if i+1 < n:
                    cur += s[i+1]
                    i += 2
                    continue
                else:
                    i += 1
                    continue
            else:
                cur += ch
                i += 1
                continue
        else:
            if ch == "'":
                in_quote = True
                i += 1
                continue
            elif ch == ',':
                fields.append(cur)
                cur = ''
                i += 1
                continue
            else:
                cur += ch
                i += 1
                continue
    fields.append(cur)
    # strip spaces
    return [f.strip() for f in fields]


def clean_sql_field(f):
    # f is raw content possibly quoted or numeric
    f = f.strip()
    if f.startswith("'") and f.endswith("'"):
        return f[1:-1]
    return f


def slugify(s):
    s = s.lower()
    s = re.sub(r'[^a-z0-9\-]+', '-', s)
    s = re.sub(r'-+', '-', s).strip('-')
    return s or 'post'


def main():
    import argparse
    import re
    import os
    import html
    from datetime import datetime

    SQL_PATH = os.path.join(os.path.dirname(__file__), '..', 'articulos.sql')
    OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'articles', 'posts')

    def read_sql(path):
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()

    parser = argparse.ArgumentParser(description='Extrae posts de un volcado SQL y genera archivos')
    parser.add_argument('--format', choices=['html', 'md'], default='md', help='Formato de salida')
    parser.add_argument('--all', action='store_true', help='Generar todos los posts en lugar de sólo los 10 últimos')
    parser.add_argument('--limit', type=int, default=10, help='Número máximo de posts a generar (si no se usa --all)')
    args = parser.parse_args()

    sql = read_sql(SQL_PATH)
    tuples = extract_tuples(sql)
    posts = []
    for t in tuples:
        fields = parse_tuple_content(t)
        # We rely on known column ordering from the SQL dump
        try:
            post_id = fields[0]
            post_date = clean_sql_field(fields[2])
            post_content = clean_sql_field(fields[4])
            post_title = clean_sql_field(fields[5])
            post_status = clean_sql_field(fields[7])
            post_name = clean_sql_field(fields[11])
            guid = clean_sql_field(fields[18])
            post_type = clean_sql_field(fields[20])
        except Exception:
            continue
        if post_type != 'post':
            continue
        # try parse date
        try:
            dt = datetime.strptime(post_date, "%Y-%m-%d %H:%M:%S")
        except Exception:
            try:
                dt = datetime.strptime(post_date, "%Y-%m-%d")
            except Exception:
                dt = datetime.min
        posts.append({
            'id': post_id,
            'date': dt,
            'content': post_content,
            'title': post_title,
            'status': post_status,
            'name': post_name,
            'guid': guid,
        })

    posts.sort(key=lambda p: p['date'], reverse=True)
    if args.all:
        latest = posts
    else:
        latest = posts[:args.limit]

    os.makedirs(OUT_DIR, exist_ok=True)
    created = []
    for p in latest:
        nm = p['name'] or slugify(p['title'])
        # sanitize nm
        nm = re.sub(r'[^A-Za-z0-9_\-]', '', nm)
        if not nm:
            nm = f"post-{p['id']}"
        ext = 'md' if args.format == 'md' else 'html'
        filename = f"{p['date'].strftime('%Y%m%d')}-{p['id']}-{nm}.{ext}"
        filepath = os.path.join(OUT_DIR, filename)
        if args.format == 'md':
            # YAML frontmatter + raw content (content is HTML in dump)
            md = []
            md.append('---')
            md.append(f"title: \"{p['title'].replace('"', '\\"')}\"")
            md.append(f"date: {p['date'].strftime('%Y-%m-%d %H:%M:%S')}")
            md.append('---')
            md.append('')
            # keep content as-is (HTML blocks) so static site generators accept it
            md.append(p['content'])
            md_text = '\n'.join(md)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(md_text)
        else:
            # basic HTML wrapper
            html_content = f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>{html.escape(p['title'])}</title>
</head>
<body>
<article>
<h1>{html.escape(p['title'])}</h1>
<p><time datetime="{p['date'].isoformat()}">{p['date'].strftime('%Y-%m-%d %H:%M:%S')}</time></p>
{p['content']}
</article>
</body>
</html>
"""
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(html_content)
        created.append(os.path.relpath(filepath, os.path.dirname(os.path.dirname(__file__))))
    print('Created', len(created), 'files:')
    for c in created:
        print('-', c)

if __name__ == '__main__':
    main()
