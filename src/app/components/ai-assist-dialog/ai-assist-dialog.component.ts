import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  PLATFORM_ID,
  computed,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AiAssistUiService } from '../../core/ai-assist-ui.service';
import { ScanStateService } from '../../core/scan-state.service';

type ChatTurn = { role: 'user' | 'assistant'; content: string };

const WELCOME =
  'Ask about your matched CVEs, products, versions, or CPEs — for example “Which Critical/KEV issues should I fix first?”';

const KEY_STORAGE = 'cvescan.geminiApiKey';

@Component({
  selector: 'cves-ai-assist-dialog',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './ai-assist-dialog.component.html',
  styleUrl: './ai-assist-dialog.component.scss',
})
export class AiAssistDialogComponent implements AfterViewInit {
  readonly closed = output<void>();
  readonly ui = inject(AiAssistUiService);
  private readonly api = inject(ApiService);
  private readonly state = inject(ScanStateService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly threadEl = viewChild<ElementRef<HTMLElement>>('thread');

  /** Turns sent to the API (user/assistant only). */
  private history: ChatTurn[] = [];

  readonly messages = signal<ChatTurn[]>([
    { role: 'assistant', content: WELCOME },
  ]);
  readonly draft = signal('');
  readonly apiKey = signal('');
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  readonly canSend = computed(
    () =>
      !this.busy() &&
      !!this.draft().trim() &&
      !!this.apiKey().trim() &&
      this.state.cves().length > 0,
  );

  readonly sendHint = computed(() => {
    if (this.busy()) return 'Sending…';
    if (!this.apiKey().trim()) return 'Paste your Gemini API key above';
    if (!this.state.cves().length) return 'Run a scan first';
    if (!this.draft().trim()) return 'Type a question first';
    return 'Send question';
  });

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const saved = localStorage.getItem(KEY_STORAGE);
        if (saved) this.apiKey.set(saved);
      } catch {
        /* ignore */
      }
    }
    this.panel()?.nativeElement.focus();
  }

  onBackdrop(ev: MouseEvent): void {
    if (ev.target === ev.currentTarget) this.close();
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.close();
  }

  close(): void {
    this.ui.hide();
    this.closed.emit();
  }

  onApiKeyChange(value: string): void {
    this.apiKey.set(value);
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const trimmed = value.trim();
      if (trimmed) localStorage.setItem(KEY_STORAGE, trimmed);
      else localStorage.removeItem(KEY_STORAGE);
    } catch {
      /* ignore */
    }
  }

  send(): void {
    if (!this.canSend()) {
      this.error.set(this.sendHint());
      return;
    }
    const text = this.draft().trim();
    const key = this.apiKey().trim();
    const cves = this.state.cves();

    const userTurn: ChatTurn = { role: 'user', content: text };
    this.history = [...this.history, userTurn];
    this.messages.update((m) => [...m, userTurn]);
    this.draft.set('');
    this.error.set(null);
    this.busy.set(true);
    this.scrollThread();

    this.api.askAssist(this.history, cves, key).subscribe({
      next: (reply) => {
        const bot: ChatTurn = { role: 'assistant', content: reply };
        this.history = [...this.history, bot];
        this.messages.update((m) => [...m, bot]);
        this.busy.set(false);
        this.scrollThread();
      },
      error: (err: { message?: string } | null) => {
        this.busy.set(false);
        this.history = this.history.slice(0, -1);
        this.error.set(err?.message || 'AI assistant failed — try again');
      },
    });
  }

  onComposerKeydown(ev: KeyboardEvent): void {
    if (ev.key !== 'Enter' || ev.shiftKey) return;
    ev.preventDefault();
    this.send();
  }

  private scrollThread(): void {
    queueMicrotask(() => {
      const el = this.threadEl()?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }
}
