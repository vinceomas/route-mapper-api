import { Injectable, Logger } from "@nestjs/common";
import { Route } from "../entities/route/route";
import { AxiosHeaders } from "axios";
import { AddressType, Client, GeocodedWaypointStatus, LatLngLiteral, Status } from "@googlemaps/google-maps-services-js";
import { RoutesClient } from "@googlemaps/routing";
import { google } from "@googlemaps/routing/build/protos/protos";

@Injectable()
export class GoogleMapsApiHandler {
    public constructor(private readonly logger: Logger){}

    public async getFakeDirectionsDetail(route: Route){
        //Simulate Google Maps directions API response 
        return {
            status: 200,
            statusText: "",
            headers: new AxiosHeaders(),
            config: {
                headers: new AxiosHeaders()
            },
            data: {
                geocoded_waypoints : [
                    {
                        geocoder_status : GeocodedWaypointStatus.OK,
                        place_id : "ChIJRVY_etDX3IARGYLVpoq7f68",
                        types : [
                        AddressType.bus_station,
                        AddressType.train_station,
                        AddressType.point_of_interest,
                        AddressType.establishment
                        ],
                        partial_match: false
                    },
                    {
                        geocoder_status : GeocodedWaypointStatus.OK,
                        partial_match : true,
                        place_id : "ChIJp2Mn4E2-woARQS2FILlxUzk",
                        types : [ AddressType.route ]
                    }
                ],
                routes : [
                {
                    bounds : {
                        northeast : {
                            lat : 34.1330949,
                            lng : -117.9143879
                        },
                        southwest : {
                            lat : 33.8068768,
                            lng : -118.3527671
                        }
                    },
                    copyrights : "Map data ©2016 Google",
                    legs : [
                        {
                            distance : {
                            text : "35.9 mi",
                            value : 57824
                            },
                            duration : {
                            text : "51 mins",
                            value : 3062
                            },
                            end_address : "Universal Studios Blvd, Los Angeles, CA 90068, USA",
                            end_location : {
                            lat : 34.1330949,
                            lng : -118.3524442
                            },
                            start_address : "Disneyland (Harbor Blvd.), S Harbor Blvd, Anaheim, CA 92802, USA",
                            start_location : {
                            lat : 33.8098177,
                            lng : -117.9154353
                            },
                            steps: [],
                            departure_time: {
                            value: new Date(),
                            text: "string",
                            time_zone: "string"
                            },
                            arrival_time: {
                            value: new Date(),
                            text: "string",
                            time_zone: "string"
                            },

                        }
                    ],    
        
                    overview_polyline : {
                        points : "knjmEnjunUbKCfEA?"
                    },
                    summary : "I-5 N and US-101 N",
                    warnings : [],
                    waypoint_order : [],
                    fare: {
                        currency: "string",
                        /** The total fare amount, in the currency specified above. */
                        value: 1,
                        /** The total fare amount, formatted in the requested language. */
                        text: ""
                    },
                    overview_path: [] as LatLngLiteral[]
                }
                ],
                status : Status.OK,
                error_message: "",
                available_travel_modes: []
            },

        }
    }

    public async getDirectionsDetail(route: Route){
        const client = new Client({});

        return client.directions({
            params: {
                origin: {
                    lat: Number(route.originLatitude),
                    lng: Number(route.originLongitude)
                },
                destination: {
                    lat: Number(route.destinationLatitude),
                    lng: Number(route.destinationLongitude)
                },
                alternatives: true,
                //key: this.configService.get<string>('GOOGLE_MAPS_API_KEY'),
                key: "AIzaSyCa2jbjuPvveaNLvXeOVf0uEPkCw2rb8Lo"
            },
            timeout: 3000, // milliseconds
        });
    }

    public async getRouteDetails(route: Route){
        const client = new RoutesClient();

        const origin = {
            location: {
                latLng: {
                    latitude: Number(route.originLatitude),
                    longitude: Number(route.originLongitude)
                }
            }
        }

        const destination = {
            location: {
                latLng: {
                    latitude: Number(route.destinationLatitude),
                    longitude: Number(route.destinationLongitude)
                }
            }
        }

        const request = {
            origin,
            destination,
            TravelMode: 1,
            client
        }

        return client.computeRoutes(request, {
            otherArgs: {
                headers: {
                    "X-Goog-FieldMask": "routes.warnings,routes.distanceMeters,routes.duration,routes.staticDuration,routes.polyline,routes.localizedValues",
                },
                timeout: 3000
            }
        })
    }

    public async getFakeRouteDetails(route: Route){
        return[
            {
                routes: [
                    {
                        legs: [],
                        warnings: [
                            "Il percorso prevede il pagamento di pedaggi.",
                            "Questo percorso prevede un tratto in autostrada."
                        ],
                        optimizedIntermediateWaypointIndex: [],
                        routeLabels: [],
                        distanceMeters: 220574,
                        duration: {
                            seconds: 9249,
                            nanos: 0
                        },
                        staticDuration: {
                            seconds: 9249,
                            nanos: 0
                        },
                        polyline: {
                            encodedPolyline: "qd|cGw~kgArEg@`A@hBNdKN`@GbB{@|Aw@v@]L]JiBLYRE\\F`AXd@?TUL_@Bq@IeAwB_R[kAcA{CSmAKqABw@j@aC\\w@RsAhEkf@Wc@kBcEQi@GYAa@BaAv@cJPeA`@sAHWX}ApBuOjCmRnA{JVqBBoACaAKgAgBmJwEyVc@gBQi@gCiFq@oBKy@Ck@J{AN{@Lc@nD}IZm@x@w@t@a@bHaBh@[Zc@NWrAuEF{@G]Q]k@a@_Ac@sA{@SUYk@SgACq@D_@X}@rGqPjGmONk@Hu@Ai@Ki@{@}AOg@Ak@D[To@f@u@LWTkAP}AFo@Lm@j@{@b@c@`@Of@KR_@BUAWCM]g@y@_AGSCU?YDUf@s@rAyArBgCXi@NkAJ}CJ}@RaAj@sBpA_Cl@y@l@c@XMf@Ad@B|Ad@bCfArBfAp@VTAJEZc@DQBo@AsCgAeO_A_LcBmTO}AKe@iFuM}IeUS_@CC_@{Ag@_DgBoOiBqPgA}I]sA_@eAgDuGqEgI_MuUaKsRSo@Bc@L]jCqAhNwFlHwCz@i@`@e@nIgNhKuPpA}BTq@CqA}K}iAc@{Eg@}E@m@BUs@WqA_AmAcAmP_PoBqBoDmDg@Yq@QkBEmIFa@Ek@S}@o@qDwC_As@]eA@UzAyDVa@b@_@hAg@|JuDv@c@Z[xEiIj@aAf@kAViANaBbAcNXmCDcBa@uXJ[VS~BaBLSCOOOg@UkAUkCs@s@Ks@[_@[eCcEo@cBOk@SeBGiBIqGKkF@y@DOvAWTOt@qARi@TuBFkAJYdE_F~@}@Vi@@]I]KOWIaA@qBLWAMQE_@OuDD}@v@mHNs@d@kBd@yELuBGy@UwA?WD[J[Xa@TSpC_A\\QXWj@}@LkA@_@Ke@eDaDeA_CqAeDGW@a@d@y@DUCo@WeEG_F@iAReAVw@`@mBH_@B}@Is@[sASkA?k@Jc@R[tAoAb@u@h@iA^[bAc@|A{@l@q@lAcClAsCv@uC?SIQOGQBg@Z]\\_AfB]`@i@Va@LiABi@YQQQe@YoAQyABi@ZcAx@yAnAqAzC}BvByAvBeBfAiAZc@Vi@jA}DbCaJHq@@u@Gi@K]]k@kAwAwDsBUYO_@Qs@Uq@tAoNt@iKR{@Vg@tAqA`IyG|@o@Z]LWH]IqIF}FPcH@_B\\kKpCe]xC{_@t@sI@yAAcFHsAjByR~C_ZNgAfCgLnJmb@~@gD\\cA|BiFdAiC~EuFtDyEJM@WIOQAA?k@IQ@mI_@gESw@M{A_@o@e@cAaAkFgGqCuDW_@Sg@Qi@o@aFEg@@wCDaANmAz@}BbBgCn@u@Vc@~A{DtBoEjA_CZgAR{@~@{FL}@N_BF{B@eAOsEUkPBcDLcEHuAdAcJf@oDb@oAtAeCVu@Ji@^uA`AsBrA_Cn@{@~EkD|@aAvAgA\\_@dAeBhAwBT}@PeBf@yAtAsCZo@Hg@Bu@Gy@Sq@w@eBIc@CcAF_@pAmD`@}ARgBDy@EgAE_@NWDm@Ca@D_AC_AJkAVqAZy@rAwBZk@jGwMjDwGHEXcANCVm@@Ij@w@Vi@jOeZj@q@j@u@@MLY?c@MmA@YL{@hAsBpAwCd@qANcAHiBDkALs@X}@h@s@rEuFH[~Y{]zBaDlB_DnByDjBoEzAmErA}EbAkEt]inB^gCTiCLiDAsC_Cuk@?_BDqBNgC\\gCb@qBbFgQ|H{XfA{CfB{DbBuCfBeCxAaB`B}AtNkLtBqAfCmA~CgApCk@vU}CzBMxCCzBHxDb@hWjDbCLtBCtBUzBg@hA_@`CiAbAq@pBcBxD_ErBcBvH{FdKgItAuAxEmFdA}@hAo@|@_@pA[zGgAxAa@nAo@hA{@dAeAz@mAzDqHdAiBdAkAjAaAzAy@pAa@rAWfBGrAFvBb@nPzDvB`@rAJrA?pAInB[bBk@~A{@fY}PvBcApC_A~Cq@trAwObmB{TlyBiW`KoAfDq@zDcAfKqDh_@aNxj@gS~OyFvFwBpC}@vi@uRhLaE|HwCj]aMtLgEbHsBvFuAlI_BrPsCnEy@xq@gLlOiC~IwAjKgBhKiBtCu@fDmAbBy@rC_BdDaCjCaCrCaDrBoCvBsDvBmEnBeFn@qBnAwEv@}DnLqu@n@oCp@yBdAoCbAsBpBaDvb@mj@nAeBzAeCjBkD|AkDfHwQ`^{~@zCaHrB_EtY}g@pGeLzMmU^e@l@iA`AmB~JmQ`EwGxN_T`w@{hA`D{D`CgCbUgTvB}BzAqBfBuCzA{C`AcCbPyf@\\kA^aBb@_DRiDfMwcDv@aSRoCd@iD^kB|@yCz@uBdAoBnAeBnAuAx@s@`Aq@rDmBrc@oT`CaBvAoApByB~A_CxB}D|@uB~@iCr@iCZqAfAoFd@gB\\eBxLoj@|@qD`AmCz@kBrAqBdBmBzAmAvA{@fBu@zAe@jQeD~O{D`LqC~Ao@dBeAhA{@z@y@|AqB`_@en@zBsDxCeE`CoCjBiBhCuBbGiEbAi@fAu@j@k@bVkPfBmAxRaN|EkD`CqBnCmCfWaYRWz_AaeAvFyFz{@kz@`CuBhBaAlA_@pCe@bUiD|BUtS{BtCShCIfBBxAL~B^|I~AzC\\`DLvRDxDB`VHtOBjPY|u@}AfBBnZpBpLz@|AVtA`@tBbAhQxKnC`B`Bv@bBh@nB^lCPfC?fCSjCi@pBu@bBy@vAaAbBwAdAiAdBaCjAsBp@{Ax@wBlIqY`BiGpBgIhAcFvDiO`AcDh@qAbAsBhB{CbJiNp@eAt@iAzCwEvAiBdDqCrAu@`EeBnFyBt\\qNbDuAdBo@dCe@vAMjCGtADlALhANnCv@vH~C`Bh@|AZpBRdCAz@EbDi@pDoAnOyFbDgApYqK~LqE|BcArAw@dCcBbCwB~AgBlA_BtAwBdBgD~A{DlAyDn@kChZiyApAiFnAkEtAgEfe@mpApb@sjAv@mBr@oAhAaBfAiAb@_@fBiAzAo@b_A_\\nAm@|AeAf@c@rA_B^k@`AqBz@eCbPoq@nEgRrAqFbA{Er@oEbCaPr@uD|AcFt@kBvAqCnAoB|AoBrBqB`HeGxD}CjD{CxD}C~BeBf@[~DcDbC{B|BeCrR{VfAoAl@k@pAw@jAe@hA[`BS`[I|A?rJGvFDtFUhBWhA]hAe@jAu@f@_@xAyAjCgDlEiGfAkAdAw@bFkBbFgAfCu@|Aq@tA{@pAoApHaJx@{@pAaAt@_@fA_@b@Kp@MpC[bF}@~@YlCeArBkAbEeClBy@fBc@fBWz@CxBDrAN~InB|EfAdAJ~ABbBMpEeAhJaCbEeAnB[|BSrDCbBFzu@dGbUhBdCF`EUlB[`Bc@~B_A`BcAbAy@bDcDjDsDjCeCrJmJbD_DRCrOyNrNgNxBiBhCaB`DaBzCiAzBo@jDq@xEg@tCMjD@xDPjEh@vBf@tDlAxB|@pB~@d@Lfq@n\\tMnGbIxDpFlB~PlJhAd@fCvAvX~MrUfKtInEtN`Ipi@zWdn@tZxAp@z|@bc@tBnAhBpAlC`CfBpBlA~Ab\\`e@~ClEzU~\\j`@pj@nChEdApBh@jAjB|E~f@rxAjBfFzAjDxAtCzBvDbChDbDxD|BxBfEdDzBvAdDbB|CpApBn@dFhAbDd@tF`@~UrAxFXzUnA~l@`DlRbAXD|CPNClXvArEZzAHt@@pWvA|{AdI|ADhQbAnQz@fIZrj@vCbCLvEVnBPlj@rCve@fCbMpA`CZvBb@rAf@~@j@XTFNfAnAt@pAl@rATdAHx@?`AG~@Q~@{BxGUz@I`@eErLwLv]iDtJyCdKKnAe@tC[fDKpCAp@NlTHrBRfBb@|B^nAj@vAfAjBvDbF~AjClGnLz@bBfAtC^|A`@~BPxBNjE^nQ@zCG`CeBtXG\\SxFK`I?|IDnBF`@PtGZ|Gb@~FfCnWj@tEz@nFlAjG~ArGpCfJdD|J|@jDj@xCj@hEVpDJhCRxLD`FCdCOrEuArT}@|LMjDEhDF~CJpCb@dGhEfb@jArJh@bDvAlHpDfPhAdEdBdEjDdFrFpJvDhHjBlEvAnCt@dBpAxDxFjRlBzGZ`BLb@d@lDLxAtAjUn@zG~@dFr@fDfA|D~@nCfBdElKxQ~Qz]hEhIzX~h@\\r@zB~DnAnBhAtAlBjBvAdAr@d@nB|@|@\\rCn@dCZhfAtGxv@rEfFRnC@hK[b@Gt]wAlCYhDo@zAc@lDyA|HyD|B_A~Bq@nDu@z[kF~BOjBBvBLjXxCh[jDhC^lDt@nVjGtDv@hD\\dK^hHNvEPvKX`i@p@`FXvC^lCf@dB^bBh@zGnCzLpFtMxF|WxLpCbAtCp@dD`@`DLjCC`AEdBQlFgAbF_Bxc@{NpIiC`JmC~I}CrI{Cd]aLxM}D|JmC`HcB`a@wIjE{@nLsBjSiEra@{I`G_BrDoAvBaAbCmA`C{ArCwBnCcCrC}C~B}C|BmDbB_DfByDzA{DtAgEnA{Ej@kCjAuGrAeJlDwXhAuKtAeQjA}Ot@}KnAiON}Ad@mDhAaGnDmPnCqLtEwRv@wDn@{Dv@qG^}DZ{EbAmQ`AiPTqEnDak@HCHULy@`@}@n@cAnGiGl@]`AK`AANEjMvAbPfCjJlBvGxApBXlDf@fBh@~Ax@lKlGle@~U|Bz@pBh@lCb@rBLfSLlBPbB^`Bn@bBbAvAlAdAnA|MhRrAvAlA~@hAn@xAj@t@TfBVp@DvBArAK|MaBpCGpBHvDn@xBn@~At@dCdBhCbCrIjI|@n@~@`@~@TbAJ|A?`AOlA]~@g@pJqHjB{AnAq@nAa@v@MdBIdA@~@JxA\\fAf@zAjArLvLtJzInA|@dCpAxCx@tBXxBHxDIr`@yA`I[vB[hBm@hBaAlA_Ah@i@rDwEtG}IhAiBbBkDxb@g`ApA_CrAkBtB}BvAkA~B{AhTyKlj@eYhAq@vAkAdBeBdBcCtAcClA{C~@aDl@wClAwHf@uB~@mCn@sAvA{BjAuAv@q@l@e@|@g@zOeIrA_AnAiAvAcBpAuB`AsB`Uso@`AyBvAkCvNsTp[ye@fFsHpA{A~EcEbTeQnGkFbBeBjBeC~I{M|D_GlNeSdPiTzCiEd@q@bE}G~]gp@nLmT|AuBf@o@~B_CrAeAtJaGjc@iX`BgAzBiBhBsBtBeDnAcC`AeCzA_F~V}|@bA{ClDsJfg@{sA~BoGlNi_@~@yBvAmC~AaClLeOnByCxVcd@lAuBxB_DhDeE~BcCzCqCzCkClC{BdAaAbAkA|@yAr@wAv@uB^yAfE_S~@qDt@sBbAoBpAiBfBgBzAiApI_GrAkAx@}@fA}AbAgBdAqCt@mCZ_BvAgMX{Ar@iCl@{Az@eBfA}AlAuAbE_DzMuJhBcBf@k@xAuBd@{@~CwGzFeL~NoZnAcD~@iDn@cD|BoNr@aDl@yBdAqCpAqCjBwD`CoEtBsE|AmEfLw_@pHyV~@uChAqCnC_FPYPU|EsIzHyMxCaF~BqDnBaCbe@wh@nBoBzCmEdB{CnGeMxKkUxGsNnK}T~A_DlSic@jCmFfLiVnGuN~S{c@|IiQlQm_@zTee@rB{EbRmf@t`@gdAzFmO`Tim@n@eCf@aCb@gDVqDFuCBeRNiDTcC`@eCn@oCdGcQf_@qeApN_a@pOkc@dAyCn|@aeC|Xuw@TMfBwEd@m@ZO^@^PRZBHZPTC~AsERs@UI_DgBq@i@sBgB_@Qi@y@_@iz@Wir@?kBPs@LO@UIUGEOs@Wy\\a@m}@IiGa@cF[sCiAeOiD{]wCg\\Q{A}AwQ~QiDGy@",
                            polylineType: "encodedPolyline"
                        },
                        description: "",
                        viewport: null,
                        travelAdvisory: null,
                        localizedValues: {
                            distance: {
                                text: "221 km",
                                languageCode: ""
                            },
                            duration: {
                                text: "2 ore 34 min",
                                languageCode: ""
                            },
                            staticDuration: {
                                text: "2 ore 34 min",
                                languageCode: ""
                            },
                            transitFare: null
                        },
                        routeToken: ""
                    }
                ],
                "fallbackInfo": null,
                "geocodingResults": null
            },
            null,
            null
        ] as unknown as Promise<[google.maps.routing.v2.IComputeRoutesResponse, google.maps.routing.v2.IComputeRoutesRequest, {}]>
    }
}
