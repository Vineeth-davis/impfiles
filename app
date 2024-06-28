def create_report_excel(report, location):
    workbook = xlsxwriter.Workbook(location)
    for result_id, result_data in report.items():
        for key in result_data['categories'].keys():
            sheetname = f"{result_id}_{key}".replace(':', '').replace(' ', '').replace('BIOS', '').replace('/', '').replace('?', '').replace('\\', '|')
            if len(sheetname) > 30:
                start = len(sheetname) - 30
            else:
                start = 0
            worksheet = workbook.add_worksheet(sheetname[start:])
            worksheet.set_column('A:Z', 25)
            bold = workbook.add_format({'bold': True})
            worksheet.write('A1', key, bold)

            row_num = 0
            for i in range(len(result_data['categories'][key])):
                dic = result_data['categories'][key][i]
                col_num = 0
                row_num += 1
                for k, value in dic.items():
                    worksheet.write(0, col_num, k, bold)
                    worksheet.write(row_num, col_num, value)
                    col_num += 1
    workbook.close()
