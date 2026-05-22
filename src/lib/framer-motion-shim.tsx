import * as React from "react";

type AnyProps = React.HTMLAttributes<HTMLElement> & Record<string, unknown>;

function createMotionTag<K extends keyof JSX.IntrinsicElements>(tag: K) {
  return React.forwardRef<HTMLElement, AnyProps>(function MotionTag(props, ref) {
    const {
      initial,
      animate,
      exit,
      transition,
      whileHover,
      whileTap,
      layout,
      variants,
      ...rest
    } = props;

    void initial;
    void animate;
    void exit;
    void transition;
    void whileHover;
    void whileTap;
    void layout;
    void variants;

    return React.createElement(tag, { ...(rest as object), ref });
  });
}

export const motion = {
  div: createMotionTag("div"),
  span: createMotionTag("span"),
  button: createMotionTag("button"),
  section: createMotionTag("section")
};

export function AnimatePresence({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
