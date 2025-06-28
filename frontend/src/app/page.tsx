
'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Clock, Target, Palette, TrendingUp, History } from 'lucide-react'

interface SaleData {
  client_id?: string
  plan?: string
  value?: number
  purchase_datetime?: string
  conversion_time?: {
    days: number
    hours: number
    minutes: number
    seconds: number
  }
}

interface AnalysisResult {
  campaign: string
  creative: string
  utm_source: string
  utm_medium: string
  confidence: string
  click_count: number
}

interface AnalysisResponse {
  sale_data: SaleData
  estimated_click_time: string
  analysis: AnalysisResult[]
  top_result: AnalysisResult | null
  events_found: number
}

interface HistoryItem {
  id: number
  client_id?: string
  plan?: string
  value?: number
  purchase_datetime?: string
  campaign?: string
  creative?: string
  confidence?: string
  created_at: string
}

export default function Home() {
  const [message, setMessage] = useState('')
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>([])

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'

  const fetchHistory = useCallback(async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/history`)
      setHistory(response.data.data || [])
    } catch (error: unknown) {
      console.error('Erro ao buscar histórico:', error)
    }
  }, [backendUrl])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory]) // fetchHistory é uma dependência do useEffect

  useEffect(() => {
    if (searchQuery) {
      const filtered = history.filter(item => 
        item.campaign?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.creative?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.client_id?.includes(searchQuery)
      )
      setFilteredHistory(filtered)
    } else {
      setFilteredHistory(history)
    }
  }, [searchQuery, history])

  const analyzeSale = async () => {
    if (!message.trim()) {
      alert('Por favor, cole a mensagem da venda')
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(`${backendUrl}/api/analyze-sale`, {
        message
      })

      setAnalysis(response.data)
      fetchHistory() // Atualizar histórico
    } catch (error: unknown) {
      let errorMessage = 'Ocorreu um erro desconhecido.'
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data.error || error.message
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      alert(`Erro: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const getConfidenceBadgeColor = (confidence: string) => {
    switch (confidence) {
      case 'Alta': return 'bg-green-500 text-white'
      case 'Média': return 'bg-yellow-500 text-white'
      case 'Baixa': return 'bg-red-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return 'N/A'
    try {
      const date = new Date(dateStr)
      return date.toLocaleString('pt-BR')
    } catch {
      return dateStr
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Meta Ads Sales Tracker
          </h1>
          <p className="text-gray-600">
            Rastreie de qual anúncio estão vindo suas vendas
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Painel Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Formulário de Análise */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Analisar Nova Venda
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Cole a mensagem do bot de vendas:
                  </label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="🎉 Pagamento Aprovado!&#10;🤖 Bot: @colegiovipbot&#10;⚙️ ID Bot: 12448&#10;🆔 ID Cliente: 2054698907&#10;...&#10;⏳ Tempo Conversão: 0d 0h 3m 51s&#10;...&#10;🕓 Data e Hora da compra: 27/06/2025 22:58"
                    className="min-h-[200px]"
                  />
                </div>
                <Button 
                  onClick={analyzeSale} 
                  disabled={loading || !message.trim()}
                  className="w-full"
                >
                  {loading ? 'Analisando...' : 'Analisar Venda'}
                </Button>
              </CardContent>
            </Card>

            {/* Resultado da Análise */}
            {analysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Resultado da Análise
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analysis.top_result ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Estimado:</span>
                          <span className="font-medium">{analysis.estimated_click_time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Campanha:</span>
                          <span className="font-medium">{analysis.top_result.campaign}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Palette className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Criativo:</span>
                          <span className="font-medium">{analysis.top_result.creative}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Confiança:</span>
                          <Badge className={getConfidenceBadgeColor(analysis.top_result.confidence)}>
                            {analysis.top_result.confidence} ({analysis.top_result.click_count} cliques)
                          </Badge>
                        </div>
                      </div>

                      {analysis.analysis && analysis.analysis.length > 1 && (
                        <div>
                          <h4 className="font-medium mb-2">Outras possibilidades:</h4>
                          <div className="space-y-2">
                            {analysis.analysis.slice(1).map((result, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span className="text-sm">
                                  {result.campaign} - {result.creative}
                                </span>
                                <Badge className={`${getConfidenceBadgeColor(result.confidence)} text-xs`}>
                                  {result.confidence} ({result.click_count})
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-sm text-gray-500">
                        Eventos encontrados: {analysis.events_found}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum clique encontrado no horário estimado</p>
                      <p className="text-sm">Tente ajustar o período de busca</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Painel Lateral - Histórico */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Histórico de Vendas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por campanha, criativo ou ID..."
                    className="pl-10"
                  />
                </div>

                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {filteredHistory.length > 0 ? (
                    filteredHistory.map((item, index) => (
                      <div key={index} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">
                            Cliente {item.client_id}
                          </span>
                          {item.confidence && (
                            <Badge className={`${getConfidenceBadgeColor(item.confidence)} text-xs`}>
                              {item.confidence}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>Campanha: {item.campaign || 'N/A'}</div>
                          <div>Criativo: {item.creative || 'N/A'}</div>
                          <div>Valor: R$ {item.value || 'N/A'}</div>
                          <div>Data: {formatDateTime(item.purchase_datetime || '')}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">
                        {searchQuery ? 'Nenhum resultado encontrado' : 'Nenhuma venda analisada ainda'}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}



