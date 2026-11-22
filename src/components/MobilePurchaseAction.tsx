import { useEffect, useState, type RefObject } from "react";

type Props = {
  inlineAction: RefObject<HTMLDivElement | null>;
  label: string;
  price: string;
  onAdd: () => void;
};

export default function MobilePurchaseAction({ inlineAction, label, price, onAdd }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const action = inlineAction.current;
    if (!action) return;

    const mobile = window.matchMedia("(max-width: 767px)");
    const update = () => {
      const header = Number.parseFloat(getComputedStyle(action).getPropertyValue("--store-header-height"));
      setVisible(mobile.matches && action.getBoundingClientRect().bottom <= header);
    };
    update();
    const resize = new ResizeObserver(update);
    resize.observe(document.body);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      resize.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [inlineAction]);

  if (!visible) return null;

  return (
    <div className="product-mobile-purchase">
      <button type="button" className="store-button" onClick={onAdd}>
        {label}<span aria-hidden="true">·</span><strong>{price}</strong>
      </button>
    </div>
  );
}
