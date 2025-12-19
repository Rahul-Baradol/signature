import portfolio from '../../public/me.svg'
import github from '../../public/github.png'
import linkedin from '../../public/linkedin2.png'

export const SocialSidebar = () => {
  const socialLinks = [
    {
      href: "https://rahulbaradol.in",
      icon: portfolio,
      alt: "Portfolio",
    },
    {
      href: "https://github.com/Rahul-Baradol/signature",
      icon: github,
      alt: "GitHub",
    },
    {
      href: "https://www.linkedin.com/in/rahul-baradol-22723b289/",
      icon: linkedin,
      alt: "LinkedIn",
    },
  ];

  return (
    <div className="absolute top-5 right-5 flex flex-col gap-4">
      {socialLinks.map((link, index) => (
        <a
          key={index}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="border-2 border-violet-600 opacity-50 hover:opacity-100 transition-opacity w-fit h-fit rounded-full overflow-hidden flex items-center justify-center bg-black/20"
        >
          <img 
            width={35} 
            height={35} 
            src={link.icon} 
            alt={link.alt} 
            className="object-cover"
          />
        </a>
      ))}
    </div>
  );
};