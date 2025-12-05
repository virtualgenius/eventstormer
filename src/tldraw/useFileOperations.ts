import { useCallback, useRef } from 'react'
import { Editor } from 'tldraw'
import { isEventStormerBoardFormat, convertBoardToShapes, parseTldrawSnapshot } from './boardFormat'
import { downloadAsJsonFile, importEventStormerShapes, importTldrawShapes } from './editorHelpers'

const JSON_INDENT_SPACES = 2

interface UseFileOperationsParams {
  editor: Editor | null
  roomId: string
}

export function useFileOperations({ editor, roomId }: UseFileOperationsParams) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExportJSON = useCallback(() => {
    if (!editor) return

    const snapshot = editor.getSnapshot()
    const json = JSON.stringify(snapshot, null, JSON_INDENT_SPACES)
    downloadAsJsonFile(json, `board-${roomId}.json`)
  }, [editor, roomId])

  const handleImportJSON = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const clearExistingShapes = useCallback(() => {
    if (!editor) return
    const currentIds = editor.getCurrentPageShapeIds()
    if (currentIds.size > 0) {
      editor.deleteShapes([...currentIds])
    }
  }, [editor])

  const importBoardData = useCallback((data: unknown) => {
    if (!editor) return

    if (isEventStormerBoardFormat(data)) {
      const shapes = convertBoardToShapes(data)
      importEventStormerShapes(editor, shapes)
      console.log(`Imported ${shapes.length} shapes from EventStormer format`)
      return
    }

    const result = parseTldrawSnapshot(data)
    if (result.error) {
      throw new Error(result.error)
    }

    importTldrawShapes(editor, result.shapes)
    console.log(`Imported ${result.shapes.length} shapes from tldraw format`)
  }, [editor])

  const resetFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editor) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      clearExistingShapes()
      importBoardData(data)
    } catch (error) {
      console.error('Failed to import board:', error)
      alert('Failed to import board JSON. Please check the file format.')
    } finally {
      resetFileInput()
    }
  }, [editor, clearExistingShapes, importBoardData, resetFileInput])

  return {
    fileInputRef,
    handleExportJSON,
    handleImportJSON,
    handleFileChange,
  }
}
