import { useCallback, useEffect, useRef, useState } from 'react';
import { createProject } from '../core/model';
import { loadProject, saveProjectIfUnchanged, STORAGE_KEY } from '../core/storage';
import type { GlyphProject } from '../core/types';

export function useProject() {
  const boot = useRef<ReturnType<typeof loadProject> | null>(null);
  if (!boot.current) boot.current = loadProject();
  const [project, setProject] = useState<GlyphProject>(() => boot.current!.project ?? createProject());
  const [warning, setWarning] = useState(boot.current.warning);
  const [recoveryData, setRecoveryData] = useState(boot.current.recoveryData);
  const [saving, setSaving] = useState(false);
  const projectRef = useRef(project);
  const revision = useRef(boot.current.revision);
  const conflict = useRef(false);
  const allowRecovery = useRef(false);
  const recoveryRef = useRef(recoveryData);

  useEffect(() => { projectRef.current = project; recoveryRef.current = recoveryData; }, [project, recoveryData]);

  const reportConflict = useCallback(() => {
    conflict.current = true;
    setSaving(false);
    setWarning('پروژه در تب دیگری تغییر کرده است. ذخیرهٔ این تب متوقف شد؛ ابتدا JSON این تب را دانلود کنید، سپس صفحه را بازخوانی کنید.');
  }, []);

  const persist = useCallback(async () => {
    if (recoveryRef.current !== null || conflict.current) return;
    if (!navigator.locks) {
      setSaving(false);
      setWarning('ذخیرهٔ امن در این مرورگر در دسترس نیست. از مرورگر به‌روز استفاده کنید و پیش از بستن صفحه JSON پروژه را دانلود کنید.');
      return;
    }
    try {
      await navigator.locks.request(STORAGE_KEY, () => {
        if (recoveryRef.current !== null || conflict.current) return;
        const result = saveProjectIfUnchanged(projectRef.current, revision.current, undefined, allowRecovery.current);
        if (result.status === 'saved') {
          revision.current = result.revision;
          allowRecovery.current = false;
          setWarning(null);
          setSaving(false);
        } else if (result.status === 'conflict') reportConflict();
        else {
          setSaving(false);
          setWarning('ذخیره در حافظهٔ مرورگر انجام نشد. پیش از بستن صفحه، JSON پروژه را دانلود کنید.');
        }
      });
    } catch {
      setSaving(false);
      setWarning('ذخیره در حافظهٔ مرورگر انجام نشد. پیش از بستن صفحه، JSON پروژه را دانلود کنید.');
    }
  }, [reportConflict]);

  useEffect(() => {
    if (recoveryData !== null || conflict.current) return;
    setSaving(true);
    const timer = window.setTimeout(() => void persist(), 250);
    return () => window.clearTimeout(timer);
  }, [project, recoveryData, persist]);

  useEffect(() => {
    const flush = () => void persist();
    const changed = (event: StorageEvent) => {
      if ((event.key === STORAGE_KEY || event.key === null) && loadProject().revision !== revision.current) reportConflict();
    };
    window.addEventListener('storage', changed);
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', flush);
    return () => {
      window.removeEventListener('storage', changed);
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', flush);
    };
  }, [persist, reportConflict]);

  useEffect(() => {
    document.documentElement.dataset.theme = project.theme;
    document.documentElement.style.colorScheme = project.theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', project.theme === 'dark' ? '#141824' : '#faf9f5');
  }, [project.theme]);

  const update = useCallback((patch: Partial<GlyphProject>) => setProject((current) => ({ ...current, ...patch })), []);
  const replace = useCallback((next: GlyphProject) => {
    if (conflict.current || loadProject().revision !== revision.current) {
      reportConflict();
      return false;
    }
    allowRecovery.current = allowRecovery.current || recoveryRef.current !== null;
    recoveryRef.current = null;
    projectRef.current = next;
    setRecoveryData(null);
    setWarning(null);
    setProject(next);
    return true;
  }, [reportConflict]);

  return { project, update, replace, warning, recoveryData, saving };
}
