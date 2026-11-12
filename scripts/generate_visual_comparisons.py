from pathlib import Path

from PIL import Image, ImageDraw, ImageOps


ROOT = Path("qa-visual/pixel-perfect-final")
REFERENCES = Path("docs/figma-reference")
FRAMES = {
    "desktop": {
        "home": "Início", "nft-detail": "Detalhes do NFT", "cart": "Carrinho de NFTs",
        "checkout": "Pagamento", "order-confirmed": "Confirmação de Pedido", "login": "Login",
        "register": "Cadastro", "profile": "Perfil do Colecionador", "wallets": "Carteiras",
    },
    "mobile": {
        "home": "Início", "nft-detail": "Detalhes do NFT", "cart": "Carrinho de NFTs",
        "checkout": "Pagamento", "login": "Login", "register": "Cadastro",
    },
}


def save_comparison(kind: str, key: str, label: str) -> None:
    current_path = ROOT / kind / f"{key}.png"
    if not current_path.exists():
        return
    reference = Image.open(REFERENCES / ("Desktop" if kind == "desktop" else "Mobile") / f"{label}.png").convert("RGB")
    current = Image.open(current_path).convert("RGB")
    if kind == "mobile":
        scale = current.width / 414
        current = current.crop((0, 0, min(round(414 * scale), current.width), min(round(896 * scale), current.height)))
        current = current.resize((414, 896), Image.Resampling.LANCZOS)
        current.save(ROOT / kind / f"{key}-viewport.png")
    left = ImageOps.contain(reference, (700, 1500))
    right = ImageOps.contain(current, (700, 1500))
    canvas = Image.new("RGB", (left.width + right.width + 20, max(left.height, right.height) + 30), "#16100d")
    canvas.paste(left, (0, 30))
    canvas.paste(right, (left.width + 20, 30))
    ImageDraw.Draw(canvas).text((0, 6), "Referência Figma                         Implementação", fill="white")
    canvas.save(ROOT / "comparacoes" / f"{kind}-{key}.png")


def main() -> None:
    (ROOT / "comparacoes").mkdir(parents=True, exist_ok=True)
    for kind, frames in FRAMES.items():
        for key, label in frames.items():
            save_comparison(kind, key, label)


if __name__ == "__main__":
    main()
