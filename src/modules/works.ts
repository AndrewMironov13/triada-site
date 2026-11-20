export function initWorks() {
  const dialog = document.querySelector<HTMLDialogElement>('#workDialog')
  const details = document.querySelector('#workDetails')
  if (!dialog || !details) return

  document.querySelectorAll<HTMLButtonElement>('[data-work]').forEach((button) => {
    const template = document.querySelector<HTMLTemplateElement>('#' + button.dataset.work)
    if (!template) return
    button.addEventListener('click', () => {
      details.replaceChildren(template.content.cloneNode(true))
      dialog.showModal()
      dialog.scrollTop = 0
    })
  })

  // The panel fills the dialog. A click on the backdrop targets the dialog itself.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close()
  })
}
