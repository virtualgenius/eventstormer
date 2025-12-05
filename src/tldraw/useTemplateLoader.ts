import { useCallback, useEffect, useRef } from 'react'
import { Editor } from 'tldraw'
import { isEventStormerBoardFormat, convertBoardToShapes } from './boardFormat'
import { importEventStormerShapes } from './editorHelpers'

interface UseTemplateLoaderParams {
  editor: Editor | null
  templateFile?: string
  storeStatus: string
}

export function useTemplateLoader({ editor, templateFile, storeStatus }: UseTemplateLoaderParams) {
  const hasLoadedTemplateRef = useRef(false)

  const shouldLoadTemplate = useCallback(() => {
    if (!editor || !templateFile || hasLoadedTemplateRef.current) return false
    if (storeStatus !== 'synced-remote') return false
    const existingShapes = editor.getCurrentPageShapes()
    return existingShapes.length === 0
  }, [editor, templateFile, storeStatus])

  const loadAndImportTemplate = useCallback((templatePath: string) => {
    fetch(`/samples/${templatePath}`)
      .then(res => res.json())
      .then(data => {
        if (!editor) return
        if (isEventStormerBoardFormat(data)) {
          const shapes = convertBoardToShapes(data)
          importEventStormerShapes(editor, shapes, { zoomToFit: true })
        }
      })
      .catch(err => console.error('Failed to load template board:', err))
  }, [editor])

  useEffect(function loadTemplateBoard() {
    if (!shouldLoadTemplate()) {
      if (editor && templateFile && storeStatus === 'synced-remote') {
        hasLoadedTemplateRef.current = true
      }
      return
    }
    hasLoadedTemplateRef.current = true
    loadAndImportTemplate(templateFile!)
  }, [shouldLoadTemplate, loadAndImportTemplate, editor, templateFile, storeStatus])
}
