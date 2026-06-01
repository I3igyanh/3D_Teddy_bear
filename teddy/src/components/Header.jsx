function Header() {
  return (
    // Pinned to the top-left of the screen, completely transparent over your 3D canvas
    <header className="fixed top-0 left-0 w-full z-50 p-6 bg-transparent">
      <h1 className="text-xl font-bold text-[#080808] tracking-[0.3em] uppercase font-mono">
        Bigyan Himalaya
      </h1>
    </header>
  );
}

export default Header;