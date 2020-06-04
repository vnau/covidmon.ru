
export class Extrapolate {
  poly: (number[]) = [];
  basis: number = 3;
  constructor(x: number[], y: number[], basis: number) {
    this.basis = basis;
    this.poly = this.Poly(x, y) ?? [...Array(this.basis)].map((v) => 0);
  }

  private CreateMatrix(x: number[], y: number[], basis: number): number[][] {
    const basisArr = [...Array(basis)];
    return basisArr.map((_, i) => {
      var row = basisArr
        .map((_, j) => x.reduce((p, v) => p + Math.pow(v, i) * Math.pow(v, j), 0));
      row[basis] = x.reduce((p, v, k) => p + y[k] * Math.pow(v, i), 0);
      return row;
    });
  }

  private GaussDirectPass(matrix: number[][], mask: number[], colCount: number, rowCount: number): boolean {
    var j, k, maxId: number;
    var maxVal: number;
    for (var i = 0; i < rowCount; i++) {
      maxId = i; maxVal = matrix[i][i];
      for (j = i + 1; j < colCount - 1; j++)
        if (Math.abs(maxVal) < Math.abs(matrix[i][j])) {
          maxId = j; maxVal = matrix[i][j];
        }
      if (maxVal === 0) {
        return false;
      }

      if (i !== maxId) {
        for (j = 0; j < rowCount; j++) {
          const tmp = matrix[j][maxId]; matrix[j][maxId] = matrix[j][i]; matrix[j][i] = tmp;
        }
        const tmp = mask[maxId]; mask[maxId] = mask[i]; mask[i] = tmp;
      }
      for (j = 0; j < colCount; j++)
        matrix[i][j] /= maxVal;

      for (j = i + 1; j < rowCount; j++) {
        const tmp = matrix[j][i];
        for (k = 0; k < colCount; k++)
          matrix[j][k] -= matrix[i][k] * tmp;
      }
    }
    return true;
  }

  private GaussReversePass(matrix: number[][], mask: number[], colCount: number, rowCount: number): number[] {
    var i, j, k: number;
    for (i = rowCount - 1; i >= 0; i--)
      for (j = i - 1; j >= 0; j--) {
        const tmp = matrix[j][i];
        for (k = 0; k < colCount; k++)
          matrix[j][k] -= matrix[i][k] * tmp;
      }
    var res: number[] = [];
    for (i = 0; i < rowCount; i++)
      res[mask[i]] = matrix[i][colCount - 1];
    return res;
  }

  private Gauss(matrix: number[][], rowCount: number, colCount: number): number[] | null {
    const mask = [...Array(colCount - 1)].map((_, i) => i);
    if (this.GaussDirectPass(matrix, mask, colCount, rowCount)) {
      return this.GaussReversePass(matrix, mask, colCount, rowCount);
    }
    else {
      console.log("failed to extrapolate");
      return null;
    }
  }

  public Approx(xd: Date): number {
    return this.Approxn(xd.valueOf());
  }

  public Approxn(x: number): number {
    return this.poly.reduce((pv, cv, i) => pv + cv * Math.pow(x, i));
  }

  private Poly(x: number[], y: number[]): number[] | null {
    const matrix = this.CreateMatrix(x, y, this.basis);
    return this.Gauss(matrix, this.basis, this.basis + 1);
  }
}
