import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { gravatarUrl } from "./gravatar";
import styles from "./App.module.css";

export function AccountAvatar({
  email,
  large = false,
}: {
  email: string;
  large?: boolean;
}) {
  const [image, setImage] = useState<{
    email: string;
    url: string;
    loaded: boolean;
  } | null>(null);
  useEffect(() => {
    let active = true;
    void gravatarUrl(email)
      .then((url) => {
        if (active) setImage({ email, url, loaded: false });
      })
      .catch(() => {
        // The local avatar also covers unavailable Web Crypto or insecure contexts.
      });
    return () => {
      active = false;
    };
  }, [email]);
  const current = image?.email === email ? image : null;
  return (
    <span
      className={`${styles.accountAvatar} ${large ? styles.accountAvatarLarge : ""}`}
      aria-hidden="true"
    >
      <Icon name="account" size="feature" />
      {current && (
        <img
          key={current.url}
          src={current.url}
          alt=""
          width={128}
          height={128}
          referrerPolicy="no-referrer"
          decoding="async"
          className={current.loaded ? styles.accountAvatarLoaded : undefined}
          onLoad={() =>
            setImage((previous) =>
              previous?.url === current.url
                ? { ...previous, loaded: true }
                : previous,
            )
          }
          onError={() =>
            setImage((previous) =>
              previous?.url === current.url ? null : previous,
            )
          }
        />
      )}
    </span>
  );
}
