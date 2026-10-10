import { useCallback, useEffect, useState } from 'react';

export type RoleNavigationConfig<TLocation extends { tab: TTab }, TTab extends string, TContext> = {
  locationFromPath: (pathname: string) => TLocation;
  pathFor: (tab: TTab, context?: TContext) => string;
  homeTab: TTab;
  homePath: string;
  markerKey: string;
  depthKey: string;
  scrollKey: string;
  scrollFrames: 1 | 2;
};

export function useRoleNavigation<TLocation extends { tab: TTab }, TTab extends string, TContext>(
  config: RoleNavigationConfig<TLocation, TTab, TContext>,
) {
  const [location, setLocation] = useState<TLocation>(() => config.locationFromPath(window.location.pathname));

  useEffect(() => {
    const current = config.locationFromPath(window.location.pathname);
    const valid = window.location.pathname === config.pathFor(current.tab, current as unknown as TContext);
    const initialPath = valid ? window.location.pathname : config.homePath;
    const initial = valid ? current : config.locationFromPath(initialPath);
    window.history.replaceState({
      ...window.history.state,
      [config.markerKey]: true,
      [config.depthKey]: 0,
      [config.scrollKey]: window.scrollY,
    }, '', initialPath);
    setLocation(initial);

    const onPopState = (event: PopStateEvent) => {
      setLocation(config.locationFromPath(window.location.pathname));
      const scrollY = typeof event.state?.[config.scrollKey] === 'number' ? event.state[config.scrollKey] : 0;
      const restore = (frames: number) => {
        if (frames > 1) window.requestAnimationFrame(() => restore(frames - 1));
        else window.requestAnimationFrame(() => window.scrollTo({ top: scrollY, behavior: 'auto' }));
      };
      restore(config.scrollFrames);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [config]);

  const navigate = useCallback((tab: TTab, context?: TContext) => {
    const nextPath = config.pathFor(tab, context);
    window.history.replaceState({ ...window.history.state, [config.scrollKey]: window.scrollY }, '');
    if (window.location.pathname !== nextPath) {
      const depth = Number(window.history.state?.[config.depthKey] || 0) + 1;
      window.history.pushState({
        [config.markerKey]: true,
        [config.depthKey]: depth,
        [config.scrollKey]: 0,
      }, '', nextPath);
    }
    setLocation(config.locationFromPath(nextPath));
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [config]);

  const goBack = useCallback((fallback: TTab = config.homeTab) => {
    if (Number(window.history.state?.[config.depthKey] || 0) > 0) window.history.back();
    else navigate(fallback);
  }, [config, navigate]);

  return { ...location, navigate, goBack };
}
