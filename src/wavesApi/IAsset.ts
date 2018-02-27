export interface IAsset {
  id: string
  alias: string
  issuer: string
  description: string
  timestamp:string
  decimals: number
  quantity: string
  reissuable: boolean
}