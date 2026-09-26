import React, { createContext, useContext, useMemo } from 'react';
import type {
  PlatformComponentsProviderProps,
  WebComponents,
  WebComponentProps,
} from '../webComponents';

const WebContext = createContext<Partial<WebComponents>>({});

/** Replacements apply only to descendants; nested registrations inherit missing entries. */
export function PlatformComponentsProvider({
  web,
  children,
}: PlatformComponentsProviderProps): React.ReactElement {
  const parent = useContext(WebContext);
  const components = useMemo(() => {
    if (!web) return parent;
    const merged = { ...parent };
    for (const [name, implementation] of Object.entries(web)) {
      if (implementation !== undefined)
        Object.assign(merged, { [name]: implementation });
    }
    return merged;
  }, [parent, web]);
  return (
    <WebContext.Provider value={components}>{children}</WebContext.Provider>
  );
}

export function useWebComponent<Name extends keyof WebComponents>(
  name: Name
): WebComponents[Name] | undefined {
  return useContext(WebContext)[name];
}

export function withWebComponent<Name extends keyof WebComponents>(
  name: Name,
  fallback: WebComponents[Name]
) {
  function WebComponent(props: WebComponentProps[Name]): React.ReactElement {
    // The mapped key couples each implementation to its own public props.
    const Component = (useWebComponent(name) ??
      fallback) as React.ComponentType<WebComponentProps[Name]>;
    return <Component {...props} />;
  }
  WebComponent.displayName = name;
  return WebComponent;
}
