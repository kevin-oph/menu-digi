import io
import os
import warnings
from pathlib import Path
from uuid import uuid4

from PIL import Image, ImageOps, UnidentifiedImageError

MAX_BYTES = 10 * 1024 * 1024
MAX_PIXELS = 40_000_000


def create_photo(data: bytes, root: Path, shop_id: str):
    """Decodifica, orienta y reencodea. No conserva metadatos ni nombre del usuario."""
    paths = []
    try:
        with warnings.catch_warnings():
            warnings.simplefilter('error', Image.DecompressionBombWarning)
            source = Image.open(io.BytesIO(data))
            if source.format not in {'JPEG', 'PNG', 'WEBP'}:
                raise ValueError('Usa una foto JPEG, PNG o WebP. HEIC aún no está admitido.')
            if source.width * source.height > MAX_PIXELS or min(source.size) < 32:
                raise ValueError('La foto debe medir al menos 32 píxeles por lado y no superar 40 megapíxeles.')
            source.draft('RGB', (1600, 1600))
            source.load()
            source.thumbnail((1600, 1600))
            image = ImageOps.exif_transpose(source).convert('RGBA')
            background = Image.new('RGBA', image.size, 'white')
            background.alpha_composite(image)
            image = background.convert('RGB')
        directory = (root / shop_id).resolve()
        directory.relative_to(root.resolve())
        directory.mkdir(parents=True, exist_ok=True)
        asset = uuid4().hex
        for suffix, size in [('', 1600), ('-thumb', 480)]:
            scaled = image.copy()
            scaled.thumbnail((size, size))
            path = directory / f'{asset}{suffix}.webp'
            temp = path.with_suffix('.tmp')
            paths.extend([temp, path])
            scaled.save(temp, format='WEBP', quality=85, method=4)
            os.replace(temp, path)
        return {'photoUrl': f'/media/{shop_id}/{asset}.webp', 'thumbnailUrl': f'/media/{shop_id}/{asset}-thumb.webp'}, paths
    except (UnidentifiedImageError, OSError, Image.DecompressionBombWarning, Image.DecompressionBombError) as exc:
        remove_created(paths, root)
        raise ValueError('No se pudo leer la foto. Usa un archivo JPEG, PNG o WebP válido.') from exc
    except Exception:
        remove_created(paths, root)
        raise


def remove_created(paths, root):
    for path in paths:
        path = Path(path).resolve()
        path.relative_to(root.resolve())
        path.unlink(missing_ok=True)
