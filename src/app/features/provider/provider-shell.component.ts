import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ContextService } from '../../core/services/context.service';

@Component({
  selector: 'app-provider-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: './provider-shell.component.html',
  styleUrls: ['./provider-shell.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProviderShellComponent {
  private readonly context = inject(ContextService);

  readonly viewingPatientId = computed(() => this.context.context().actingAsPatientId);

  readonly navItems = [
    { label: 'My Patients', path: '/provider', icon: '👥' },
    { label: 'Today', path: '/provider/today', icon: '🩺' },
    { label: 'Insights', path: '/provider/insights', icon: '📊' }
  ];

  exitViewAs() {
    this.context.exitViewAs();
  }
}
