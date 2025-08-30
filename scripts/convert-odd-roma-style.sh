#!/bin/bash

# Roma style ODD conversion using TEI Garage
# ODD -> ODDC -> TEI -> xhtml/RNG chain conversion

ODD_FILE="$1"
OUTPUT_TYPE="$2"  # "html" or "rng"

if [ -z "$ODD_FILE" ] || [ -z "$OUTPUT_TYPE" ]; then
    echo "Usage: $0 <odd-file> <output-type>"
    echo "  output-type: html or rng"
    exit 1
fi

BASE_NAME=$(basename "$ODD_FILE" .odd)
DIR_NAME=$(dirname "$ODD_FILE")

# Properties for the conversion
PROPERTIES='<conversions><conversion index="0"><property id="oxgarage.getImages">false</property><property id="oxgarage.getOnlineImages">false</property><property id="oxgarage.lang">ja</property><property id="oxgarage.textOnly">false</property><property id="pl.psnc.dl.ege.tei.profileNames">default</property></conversion><conversion index="1"><property id="oxgarage.getImages">false</property><property id="oxgarage.getOnlineImages">false</property><property id="oxgarage.lang">ja</property><property id="oxgarage.textOnly">false</property><property id="pl.psnc.dl.ege.tei.profileNames">default</property></conversion></conversions>'

if [ "$OUTPUT_TYPE" = "html" ]; then
    echo "Converting ODD to HTML documentation (Roma style)..."
    
    # ODD -> ODDC -> TEI -> xhtml
    # Note: Properties should be URL-encoded when passed as query parameter
    # For simplicity, we'll pass it directly without the properties parameter
    curl -s -o "${DIR_NAME}/${BASE_NAME}.html" \
        -F upload=@"$ODD_FILE" \
        "https://teigarage.tei-c.org/ege-webservice/Conversions/ODD%3Atext%3Axml/ODDC%3Atext%3Axml/TEI%3Atext%3Axml/xhtml%3Aapplication%3Axhtml%2Bxml/conversion"
    
    if [ -f "${DIR_NAME}/${BASE_NAME}.html" ]; then
        # Check if it's an error page
        if grep -q "HTTP Status" "${DIR_NAME}/${BASE_NAME}.html"; then
            echo "Error occurred during conversion:"
            head -n 5 "${DIR_NAME}/${BASE_NAME}.html"
        else
            echo "HTML documentation saved to ${DIR_NAME}/${BASE_NAME}.html"
        fi
    else
        echo "Failed to create HTML"
    fi
    
elif [ "$OUTPUT_TYPE" = "rng" ]; then
    echo "Converting ODD to RNG schema (Roma style)..."
    
    # ODD -> ODDC -> RELAXNG (correct endpoint)
    curl -s -o "${DIR_NAME}/${BASE_NAME}.rng" \
        -F upload=@"$ODD_FILE" \
        "https://teigarage.tei-c.org/ege-webservice/Conversions/ODD%3Atext%3Axml/ODDC%3Atext%3Axml/relaxng%3Aapplication%3Axml-relaxng/conversion"
    
    if [ -f "${DIR_NAME}/${BASE_NAME}.rng" ]; then
        # Check if it's an error page
        if grep -q "HTTP Status" "${DIR_NAME}/${BASE_NAME}.rng"; then
            echo "Error occurred during conversion:"
            head -n 5 "${DIR_NAME}/${BASE_NAME}.rng"
        else
            echo "RNG schema saved to ${DIR_NAME}/${BASE_NAME}.rng"
        fi
    else
        echo "Failed to create RNG"
    fi
fi