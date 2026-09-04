"""Validate published exports and links without running ComfyUI or using a GPU."""
import hashlib
import json
import re
import struct
import zlib
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
ALLOWED_COLLECTIONS = {'Codex MCP Demos', 'James-GoldStandard'}
PRIVATE_PATH = re.compile(r'(?<![A-Za-z0-9])[A-Za-z]:[\\/]|\\\\[A-Za-z0-9_.-]+[\\/]')
TOKEN = re.compile(r'(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|hf_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9_-]{20,})')

def load(path):
    return json.loads(path.read_text(encoding='utf-8'))

def inspect(value):
    if isinstance(value, dict):
        for item in value.values(): inspect(item)
    elif isinstance(value, list):
        for item in value: inspect(item)
    elif isinstance(value, str):
        if value.strip().startswith(('{', '[')):
            try: nested = json.loads(value)
            except ValueError: pass
            else:
                inspect(nested)
                return
        assert not PRIVATE_PATH.search(value), 'Absolute local path found'
        assert not TOKEN.search(value), 'Credential-shaped token found'

def png_metadata(path):
    data = path.read_bytes()
    assert data[:8] == b'\x89PNG\r\n\x1a\n'
    offset = 8
    metadata = {}
    image_data = bytearray()
    while offset < len(data):
        length = struct.unpack('>I', data[offset:offset+4])[0]
        kind = data[offset+4:offset+8]
        payload = data[offset+8:offset+8+length]
        crc = struct.unpack('>I', data[offset+8+length:offset+12+length])[0]
        assert zlib.crc32(kind+payload) & 0xffffffff == crc
        assert kind not in (b'eXIf', b'zTXt', b'iTXt')
        if kind == b'tEXt':
            key, text = payload.split(b'\0', 1)
            metadata[key.decode()] = json.loads(text)
        if kind == b'IDAT': image_data.extend(payload)
        offset += 12+length
    assert set(metadata) == {'workflow', 'prompt'}
    assert zlib.decompress(image_data)
    inspect(metadata)
    return metadata

def main():
    workflows = load(ROOT/'catalog/workflows.json')
    examples = load(ROOT/'catalog/examples.json')
    assert len(workflows) == len(list((ROOT/'workflows').rglob('*.json')))
    for path in (ROOT/'workflows').rglob('*.json'):
        assert path.relative_to(ROOT/'workflows').parts[0] in ALLOWED_COLLECTIONS, 'Default templates must not be published'
    for row in workflows:
        assert row['category'] in ALLOWED_COLLECTIONS
        path = ROOT/row['workflow']
        graph = load(path)
        assert isinstance(graph['nodes'], list) and isinstance(graph['links'], list)
        assert hashlib.sha256(path.read_bytes().replace(b'\r\n', b'\n')).hexdigest() == row['sha256']
        assert (ROOT/row['guide']).is_file()
    for file in ROOT.rglob('*.json'):
        if '.git' not in file.parts: inspect(load(file))
    for row in examples:
        meta = png_metadata(ROOT/row['image'])
        assert meta['workflow'] == load(ROOT/row['captured_workflow'])
        assert meta['prompt'] == load(ROOT/row['api_prompt'])
        assert (ROOT/row['library_workflow']).is_file()
    for file in (ROOT/'tags').glob('*.json'):
        library = load(file)
        names = [t['name'].lower() for t in library['tags']]
        assert len(names) == len(set(names))
        for tag in library['tags']:
            assert isinstance(tag['text'], str)
            if tag.get('kind') == 'list':
                assert tag['cat'] in library['listCats']
                assert tag['text'].strip()
    checked_links = 0
    for file in ROOT.rglob('*.md'):
        text = file.read_text(encoding='utf-8')
        assert not PRIVATE_PATH.search(text), file
        for target in re.findall(r'\]\(([^)]+)\)', text):
            parsed = urlsplit(target)
            if parsed.scheme or parsed.netloc or not parsed.path: continue
            path = (file.parent/unquote(parsed.path)).resolve()
            assert path.is_relative_to(ROOT.resolve()), (file, target)
            assert path.exists(), (file, target)
            checked_links += 1
    assert all(f.stat().st_size < 50*1024*1024 for f in ROOT.rglob('*') if f.is_file() and '.git' not in f.parts)
    print(f'PASS: {len(workflows)} workflows, {len(examples)} PNG/captured-workflow pairs, tag libraries and {checked_links} local documentation links.')

if __name__ == '__main__':
    main()
