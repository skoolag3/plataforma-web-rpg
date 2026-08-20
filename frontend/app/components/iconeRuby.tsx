import Image from "next/image";
import styles from "./iconeRuby.module.css";

type Props = {
  className?: string;
  tamanho?: number;
};

export function IconeRuby({ className = "", tamanho = 18 }: Props) {
  return (
    <Image
      aria-hidden="true"
      alt=""
      className={`${styles.iconeRuby} ${className}`.trim()}
      src="/images/ruby.png"
      width={tamanho}
      height={tamanho}
    />
  );
}
