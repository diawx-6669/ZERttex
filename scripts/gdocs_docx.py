#!/usr/bin/env python3
"""Restyle a pandoc DOCX to look like a default Google Docs document.

Arial 11pt body, Google heading sizes (Title 26, H1 20, H2 16, H3 14, H4 12),
non-bold black headings, black 0.5pt table borders, A4 with 1" margins, and
"[[PAGEBREAK]]" marker paragraphs turned into real page breaks.

Usage: python3 scripts/gdocs_docx.py file.docx
"""
import re
import shutil
import sys
import tempfile
import zipfile

ARIAL = '<w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial" w:cs="Arial" />'
HEADINGS = {
    'Title': (52, '000000', 0, 60),
    'Heading1': (40, '000000', 400, 120),
    'Heading2': (32, '000000', 360, 120),
    'Heading3': (28, '434343', 320, 80),
    'Heading4': (24, '666666', 280, 80),
}


def restyle(styles: str) -> str:
    styles = re.sub(r'<w:rFonts [^>]*/>', ARIAL, styles)
    styles = re.sub(r'(<w:rPrDefault>.*?<w:sz w:val=")\d+(".*?<w:szCs w:val=")\d+', r'\g<1>22\g<2>22', styles, flags=re.S)
    styles = styles.replace('<w:spacing w:after="200" />', '<w:spacing w:after="0" w:line="276" w:lineRule="auto" />', 1)

    def fix_style(m):
        block = m.group(0)
        sid = re.search(r'w:styleId="([^"]+)"', block).group(1)
        if sid in HEADINGS:
            size, color, before, after = HEADINGS[sid]
            block = re.sub(r'<w:b\s*/>|<w:bCs\s*/>|<w:i\s*/>|<w:iCs\s*/>|<w:color [^>]*/>|<w:sz [^>]*/>|<w:szCs [^>]*/>', '', block)
            block = re.sub(r'<w:spacing [^>]*/>', f'<w:spacing w:before="{before}" w:after="{after}" />', block)
            block = re.sub(r'<w:jc [^>]*/>', '', block)
            block = block.replace('</w:rPr>', f'<w:color w:val="{color}" /><w:sz w:val="{size}" /><w:szCs w:val="{size}" /></w:rPr>', 1)
        if sid in ('BodyText', 'FirstParagraph'):
            block = re.sub(r'<w:spacing [^>]*/>', '<w:spacing w:before="0" w:after="160" />', block)
        if sid == 'Table':
            borders = ''.join(f'<w:{b} w:val="single" w:sz="4" w:space="0" w:color="000000" />' for b in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'))
            block = block.replace('<w:tblInd w:type="dxa" w:w="0" />', f'<w:tblInd w:type="dxa" w:w="0" /><w:tblBorders>{borders}</w:tblBorders>', 1)
            block = re.sub(r'<w:top w:type="dxa" w:w="0" />', '<w:top w:type="dxa" w:w="80" />', block)
            block = re.sub(r'<w:bottom w:type="dxa" w:w="0" />', '<w:bottom w:type="dxa" w:w="80" />', block)
        return block

    return re.sub(r'<w:style [^>]*>.*?</w:style>', fix_style, styles, flags=re.S)


def fix_document(doc: str) -> str:
    doc = re.sub(r'<w:p>(?:(?!<w:p>).)*?\[\[PAGEBREAK\]\].*?</w:p>', '<w:p><w:r><w:br w:type="page" /></w:r></w:p>', doc, flags=re.S)
    doc = re.sub(r'<w:p [^>]*>(?:(?!<w:p[ >]).)*?\[\[PAGEBREAK\]\].*?</w:p>', '<w:p><w:r><w:br w:type="page" /></w:r></w:p>', doc, flags=re.S)
    # Tables span the full text width like in Google Docs.
    doc = doc.replace('<w:tblW w:type="auto" w:w="0" />', '<w:tblW w:type="pct" w:w="5000" />')
    page = '<w:pgSz w:w="11906" w:h="16838" /><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0" />'
    if '<w:sectPr' in doc:
        doc = re.sub(r'<w:pgSz [^>]*/>', '', doc)
        doc = re.sub(r'<w:pgMar [^>]*/>', '', doc)
        doc = re.sub(r'(<w:sectPr[^>]*>)', r'\1' + page, doc, count=1)
    else:
        doc = doc.replace('</w:body>', f'<w:sectPr>{page}</w:sectPr></w:body>')
    return doc


def main(path: str) -> None:
    tmp = tempfile.mktemp(suffix='.docx')
    with zipfile.ZipFile(path) as zin, zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            data = zin.read(item.filename)
            if item.filename == 'word/styles.xml':
                data = restyle(data.decode('utf-8')).encode('utf-8')
            elif item.filename == 'word/document.xml':
                data = fix_document(data.decode('utf-8')).encode('utf-8')
            zout.writestr(item, data)
    shutil.move(tmp, path)


if __name__ == '__main__':
    main(sys.argv[1])
