export function Logo() {
  return (
    <a className="logo" href="#top" aria-label="豆谱首页">
      <svg className="logo-mark" viewBox="0 0 48 48" aria-hidden="true">
        <path className="logo-mark__tail" d="M33.7 31.2 43 39.8l-14.2-2.4Z" />
        <path className="logo-mark__body" d="M12.4 28.6c0-10 6.4-18.3 16.1-18.3 8.4 0 14 6.5 14 15.2 0 10.2-7.7 15.2-16.4 15.2-8.4 0-13.7-4.5-13.7-12.1Z" />
        <path className="logo-mark__breast" d="M12.4 28.6c0-7.9 4-14.8 10.8-17.3 2.6 3.6 3.8 7.5 3.8 12.3 0 6.6-2.7 12.4-7.2 16.1-5-1.6-7.4-5.4-7.4-11.1Z" />
        <path className="logo-mark__wing" d="M27.2 18.8c7.7.3 12.9 5.3 12.9 11.6 0 3.2-1.3 5.7-3.3 7.5-2.5-1-6.6-3.5-9.4-6.8-2.1-2.5-3.1-5.3-3.1-8.1 0-1.4.3-2.8.9-4.2Z" />
        <path className="logo-mark__cheek" d="M15.5 19.9c2.5-4.4 6.9-6.8 11.4-6.8 1.5 0 3 .2 4.4.7l-3.8 5.1-5.4 2.7-5.5.1Z" />
        <path className="logo-mark__beak" d="m14.5 21.4-8.2 3.5 8.5 2.8c1.3-1.7 1.3-4.1-.3-6.3Z" />
        <circle className="logo-mark__eye" cx="20.8" cy="17.4" r="2.45" />
        <circle className="logo-mark__eye-glint" cx="21.6" cy="16.7" r=".65" />
      </svg>
      <span className="logo-wordmark">
        <span className="logo-cn">豆谱</span>
        <span className="logo-latin">DOUPU</span>
      </span>
    </a>
  )
}
