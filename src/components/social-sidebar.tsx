export const SocialSidebar = () => {
  const socialLinks = [
    {
      href: "https://rahulbaradol.in",
      icon: "/me.svg",
      alt: "Portfolio",
    },
    {
      href: "https://github.com/Rahul-Baradol/signature",
      icon: "/github.png",
      alt: "GitHub",
    },
    {
      href: "https://www.linkedin.com/in/rahul-baradol-22723b289/",
      icon: "/linkedin2.png",
      alt: "LinkedIn",
    },
  ];

  return (
    <div className="absolute top-5 right-5 flex flex-col gap-4 z-5 px-3 py-4 rounded-full bg-transparent/20 backdrop-blur-md border border-white/30">
      {socialLinks.map((link, index) => (
        <a
          key={index}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="border-2 border-violet-600 opacity-50 hover:opacity-100 transition-opacity w-fit h-fit rounded-full overflow-hidden flex items-center justify-center bg-black/20"
        >
          <img 
            src={link.icon} 
            alt={link.alt} 
            className="object-cover w-6 md:w-8 h-auto"
          />
        </a>
      ))}
    </div>
  );
};