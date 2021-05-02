import dataJSON from './example.json'

export type Colors = {[keys: string]: string}
export type Columns = (string | number)[][]
export type Names = {[keys: string]: string}
export type Types = {[keys: string]: string}

export interface Data {
    colors: Colors
    columns: Columns
    names: Names
    types: Types
}

export const data: Data[] = dataJSON