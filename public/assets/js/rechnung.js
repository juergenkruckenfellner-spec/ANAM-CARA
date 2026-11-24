/* Rechnung: Drucken bzw. als PDF speichern */
document.querySelectorAll('[data-drucken]').forEach(b => b.addEventListener('click', () => window.print()));
